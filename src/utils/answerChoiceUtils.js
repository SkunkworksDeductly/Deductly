export const getChoiceText = (choice) => {
  if (!choice) return ''

  if (typeof choice === 'object') {
    if (typeof choice.text === 'string') return choice.text
    if (typeof choice.label === 'string') return choice.label
    if (typeof choice.value === 'string') return choice.value
    return ''
  }

  if (typeof choice !== 'string') return ''

  const match = choice.match(/^[A-Z][\)\.]?\s*(.*)$/)
  return match ? match[1] : choice
}
