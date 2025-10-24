import React, { useRef, useCallback } from 'react'
import { renderTextWithHighlights } from '../utils/highlightRenderer'

/**
 * HighlightableText - Makes text content highlightable via text selection
 *
 * @param {string} text - The plain text to render
 * @param {Array<[number, number]>} highlights - Existing highlight ranges [[start, end], ...]
 * @param {Function} onHighlightChange - Callback when highlights change: (newHighlights) => void
 * @param {string} className - Optional additional CSS classes
 */
const HighlightableText = ({ text, highlights = [], onHighlightChange, className = '' }) => {
  const containerRef = useRef(null)

  /**
   * Converts a DOM Selection to character indices in the original text
   */
  const getSelectionIndices = useCallback(() => {
    const selection = window.getSelection()

    // No selection or collapsed selection (just a cursor)
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return null
    }

    const range = selection.getRangeAt(0)
    const container = containerRef.current

    if (!container || !container.contains(range.commonAncestorContainer)) {
      return null
    }

    // Get all text nodes in the container to calculate positions
    const textNodes = []
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )

    let node
    while ((node = walker.nextNode())) {
      textNodes.push(node)
    }

    // Calculate character positions for each text node
    let currentOffset = 0
    const nodeOffsets = new Map()

    textNodes.forEach(textNode => {
      nodeOffsets.set(textNode, currentOffset)
      currentOffset += textNode.textContent.length
    })

    // Find start and end positions
    let startPos = null
    let endPos = null

    // Calculate start position
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const startNodeOffset = nodeOffsets.get(range.startContainer)
      if (startNodeOffset !== undefined) {
        startPos = startNodeOffset + range.startOffset
      }
    }

    // Calculate end position
    if (range.endContainer.nodeType === Node.TEXT_NODE) {
      const endNodeOffset = nodeOffsets.get(range.endContainer)
      if (endNodeOffset !== undefined) {
        endPos = endNodeOffset + range.endOffset
      }
    }

    // Validate we got valid positions
    if (startPos === null || endPos === null || startPos >= endPos) {
      return null
    }

    return [startPos, endPos]
  }, [])

  /**
   * Merges a new highlight range with existing highlights
   * Handles overlaps and adjacent ranges
   */
  const mergeHighlights = useCallback((existingHighlights, newRange) => {
    const allRanges = [...existingHighlights, newRange]

    // Sort by start position
    allRanges.sort((a, b) => a[0] - b[0])

    // Merge overlapping/adjacent ranges
    const merged = []
    let current = allRanges[0]

    for (let i = 1; i < allRanges.length; i++) {
      const next = allRanges[i]

      // Check if ranges overlap or are adjacent
      if (next[0] <= current[1]) {
        // Merge: extend current range to encompass next
        current = [current[0], Math.max(current[1], next[1])]
      } else {
        // No overlap: save current and move to next
        merged.push(current)
        current = next
      }
    }

    // Don't forget the last range
    merged.push(current)

    return merged
  }, [])

  /**
   * Check if a range overlaps with any existing highlights
   * Returns array of overlapping highlight indices
   */
  const findOverlappingHighlights = useCallback((newStart, newEnd, existingHighlights) => {
    const overlapping = []
    existingHighlights.forEach((highlight, index) => {
      const [hStart, hEnd] = highlight
      // Check if ranges overlap
      if (newStart < hEnd && newEnd > hStart) {
        overlapping.push(index)
      }
    })
    return overlapping
  }, [])

  /**
   * Remove highlights by their indices
   */
  const removeHighlightsByIndices = useCallback((highlights, indices) => {
    return highlights.filter((_, index) => !indices.includes(index))
  }, [])

  /**
   * Get click position in text when user clicks without selecting
   */
  const getClickPosition = useCallback((event) => {
    const container = containerRef.current
    if (!container) return null

    // Get the clicked element
    const target = event.target

    // Check if click was on a text node or its parent
    let textNode = null
    if (target.nodeType === Node.TEXT_NODE) {
      textNode = target
    } else if (target.firstChild && target.firstChild.nodeType === Node.TEXT_NODE) {
      textNode = target.firstChild
    }

    if (!textNode) return null

    // Get all text nodes to calculate position
    const textNodes = []
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
      false
    )

    let node
    let currentOffset = 0
    const nodeOffsets = new Map()

    while ((node = walker.nextNode())) {
      nodeOffsets.set(node, currentOffset)
      currentOffset += node.textContent.length
      textNodes.push(node)
    }

    const clickedNodeOffset = nodeOffsets.get(textNode)
    if (clickedNodeOffset === undefined) return null

    // Return approximate middle of the clicked text node
    return clickedNodeOffset + Math.floor(textNode.textContent.length / 2)
  }, [])

  /**
   * Handle click event to remove highlights
   */
  const handleClick = useCallback((event) => {
    // Only process if there's no text selection (i.e., a simple click)
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      return // User is selecting text, let mouseUp handle it
    }

    const clickPos = getClickPosition(event)
    if (clickPos === null) return

    // Check if click was inside a highlight
    const clickedHighlightIndex = highlights.findIndex(([start, end]) =>
      clickPos >= start && clickPos < end
    )

    if (clickedHighlightIndex !== -1) {
      // Remove this highlight
      const newHighlights = highlights.filter((_, index) => index !== clickedHighlightIndex)
      onHighlightChange?.(newHighlights)
      event.preventDefault()
    }
  }, [highlights, onHighlightChange, getClickPosition])

  /**
   * Handle mouse up event to capture selection
   * Merges overlapping highlights into larger combined highlights
   */
  const handleMouseUp = useCallback(() => {
    const indices = getSelectionIndices()

    if (!indices) {
      return
    }

    const [start, end] = indices

    // Find any overlapping highlights
    const overlappingIndices = findOverlappingHighlights(start, end, highlights)

    if (overlappingIndices.length > 0) {
      // Get the overlapping highlights to merge with new selection
      const overlappingHighlights = overlappingIndices.map(i => highlights[i])

      // Find the full range that encompasses all overlapping highlights + new selection
      const allRanges = [...overlappingHighlights, [start, end]]
      const minStart = Math.min(...allRanges.map(r => r[0]))
      const maxEnd = Math.max(...allRanges.map(r => r[1]))

      // Remove the overlapping highlights and add the merged one
      const nonOverlapping = removeHighlightsByIndices(highlights, overlappingIndices)
      const newHighlights = mergeHighlights(nonOverlapping, [minStart, maxEnd])

      onHighlightChange?.(newHighlights)
    } else {
      // Add new highlight
      const newHighlights = mergeHighlights(highlights, [start, end])
      onHighlightChange?.(newHighlights)
    }

    // Clear the selection visually
    window.getSelection()?.removeAllRanges()
  }, [highlights, onHighlightChange, getSelectionIndices, mergeHighlights, findOverlappingHighlights, removeHighlightsByIndices])

  const renderedContent = renderTextWithHighlights(text, highlights)

  return (
    <span
      ref={containerRef}
      onClick={handleClick}
      onMouseUp={handleMouseUp}
      className={`select-text cursor-text ${className}`}
      style={{ userSelect: 'text' }}
    >
      {renderedContent}
    </span>
  )
}

export default HighlightableText
