/**
 * SSML (Speech Synthesis Markup Language) is a subset of XML specifically
 * designed for controlling synthesis. You can see examples of how the SSML
 * should be parsed in `ssml.test.ts`.
 *
 * DO NOT USE CHATGPT, COPILOT, OR ANY AI CODING ASSISTANTS.
 * Conventional auto-complete and Intellisense are allowed.
 *
 * DO NOT USE ANY PRE-EXISTING XML PARSERS FOR THIS TASK.
 * You may use online references to understand the SSML specification, but DO NOT read
 * online references for implementing an XML/SSML parser.
 */

/** Parses SSML to a SSMLNode, throwing on invalid SSML */
export function parseSSML(ssml: string): SSMLNode {
  // NOTE: Don't forget to run unescapeXMLChars on the SSMLText

  // console.log("PARSE SSML", ssml)
  const arr = ssml.split('>')

  const attributes: any = []
  arr.forEach((text: string, i: number) => {
    if (i > 0) {
      // FOR Children
    }
    if (text.includes('=')) {
      const [tag, attributeKeyValueText] = text.split(' ')
      if (attributeKeyValueText.includes('=')) {
        const [key, stringedValue] = text.split('=')
        attributes.push({
          name: key,
          value: stringedValue.replaceAll('"', ''),
        })
      }
    }
  })
  return {
    name: 'speak',
    attributes: attributes,
    children: [],
  }
}

/** Recursively converts SSML node to string and unescapes XML chars */
export function ssmlNodeToText(node: SSMLTag): string {
  console.log('SSML to XML', node)
  if (node.children.length) {
    const val = node.children
      .map((item) => {
        if (typeof item === 'string') return item
        return ssmlNodeToText(item)
      })
      .flat()
      .toString()
      .replaceAll(',', '')
    return val as string
  }
  return ''
}

// Already done for you
const unescapeXMLChars = (text: string) =>
  text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&')

type SSMLNode = SSMLTag | SSMLText
type SSMLTag = {
  name: string
  attributes: SSMLAttribute[]
  children: SSMLNode[]
}
type SSMLText = string
type SSMLAttribute = { name: string; value: string }
