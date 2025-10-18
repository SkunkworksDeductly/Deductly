import React from 'react'

/**
 * Renders text with highlighted segments using <mark> tags
 *
 * @param {string} text - The text to render
 * @param {Array<[number, number]>} highlights - Array of [startIndex, endIndex] pairs
 * @returns {Array<string|React.Element>} - Array of text segments and <mark> elements
 *
 * @example
 * renderTextWithHighlights("Hello world", [[0, 5], [6, 11]])
 * // Returns: [<mark key="0-5">Hello</mark>, " ", <mark key="6-11">world</mark>]
 */
export const renderTextWithHighlights = (text, highlights) => {
  // Handle edge cases
  if (!text || typeof text !== 'string') {
    return []
  }

  if (!highlights || !Array.isArray(highlights) || highlights.length === 0) {
    return [text]
  }

  // Filter and validate highlight ranges
  const validRanges = highlights
    .filter(range => {
      if (!Array.isArray(range) || range.length !== 2) return false
      const [start, end] = range
      return (
        typeof start === 'number' &&
        typeof end === 'number' &&
        start >= 0 &&
        end <= text.length &&
        start < end
      )
    })
    .sort((a, b) => a[0] - b[0]) // Sort by start position

  if (validRanges.length === 0) {
    return [text]
  }

  // Merge overlapping ranges
  const mergedRanges = []
  let currentRange = validRanges[0]

  for (let i = 1; i < validRanges.length; i++) {
    const [currentStart, currentEnd] = currentRange
    const [nextStart, nextEnd] = validRanges[i]

    if (nextStart <= currentEnd) {
      // Ranges overlap or touch - merge them
      currentRange = [currentStart, Math.max(currentEnd, nextEnd)]
    } else {
      // No overlap - save current and move to next
      mergedRanges.push(currentRange)
      currentRange = validRanges[i]
    }
  }
  mergedRanges.push(currentRange) // Don't forget the last range

  // Build result array with text segments and <mark> elements
  const result = []
  let lastIndex = 0

  mergedRanges.forEach(([start, end], index) => {
    // Add non-highlighted text before this highlight
    if (start > lastIndex) {
      result.push(text.substring(lastIndex, start))
    }

    // Add highlighted text
    result.push(
      <mark key={`highlight-${start}-${end}`} className="bg-yellow-200 text-inherit">
        {text.substring(start, end)}
      </mark>
    )

    lastIndex = end
  })

  // Add any remaining non-highlighted text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex))
  }

  return result
}
