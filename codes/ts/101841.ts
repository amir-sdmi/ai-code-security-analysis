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

  let firstName: string = ''
  let firstAttrs: SSMLAttribute[] = []

  let fullTree: any = defineTag(ssml)

  // console.log('fullTree', JSON.stringify(fullTree, null, 4))

  if (fullTree.length > 1) {
    throw new Error('speak must be on top')
  }

  firstName = fullTree[0].name

  firstAttrs = fullTree[0].attributes

  if (firstName != 'speak') {
    throw new Error('no speak tag')
  }

  return {
    name: firstName,
    attributes: firstAttrs,
    children: fullTree[0].children
  }

}

/** Recursively converts SSML node to string and unescapes XML chars */
export function ssmlNodeToText(node: SSMLNode): string {

  const recursiveNodesToText = (nodes: any[]): string => {
    let res: string = ''
    console.log('nodes', nodes)
    for (let i = 0; i < nodes.length; i++) {
      if (typeof nodes[i] == 'string') {
        res += nodes[i]
      } else {
        res += recursiveNodesToText(nodes[i].children)
      }
    }
    return res
  }

  return recursiveNodesToText([node])
}

// Already done for you
const unescapeXMLChars = (text: string) =>
  text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&')


const defineTag = (ssml: string): SSMLNode[] => {

  let j = 0
  let nodes: SSMLNode[] = []

  while (j < ssml.length) {
    if (ssml[j] == '<') {
      let name: string = ''
      let attrs: SSMLAttribute[] = []
      let strAttr: string = ''
      let tmpStr: string = ''
      j += 1
      if (ssml[j] == '/') {
        throw new Error('invalid close tag')
      }
      while (j < ssml.length && ssml[j] != '>') {
        tmpStr += ssml[j]
        if (ssml[j] == ' ' && tmpStr && !name) {
          name = tmpStr.trim()
          tmpStr = ''
        }
        j += 1
      }
      if (!name) {
        name = tmpStr.trim()
        tmpStr = ''
      }
      if (tmpStr) strAttr = tmpStr.trim()
      if (strAttr) {
        attrs = attributeParser(strAttr)
      }
      if (!name) {
        throw new Error('tag withot name')
      }
      j += 1
      let closeTag = findCloseTagIndex(ssml, name)
      let insideSsml: string = ''
      if (closeTag.start == -1) {
        throw new Error('no close tag')
      }
      insideSsml = ssml.slice(j, closeTag.start)
      j = closeTag.end
      let node = {
        name: name,
        attributes: attrs,
        children: defineTag(insideSsml)
      }
      nodes.push(node)
    } else {
      let node = ''
      while (j < ssml.length && ssml[j] != '<') {
        node += ssml[j]
        j += 1
      }
      j -= 1
      nodes.push(unescapeXMLChars(node))
    }
    j += 1
  }

  return nodes
}


const findCloseTagIndex = (ssml: string, name: string): CloseTagData => {
  let j = 0
  while (j < ssml.length) {
    if (ssml[j] == '<') {
      let start: number = j
      let currentName: string = ''
      j += 1
      if (ssml[j] == '/') {
        j += 1
        while (j < ssml.length && ssml[j] != '>') {
          if (ssml[j] != ' ') {
            currentName += ssml[j]
          }
          j += 1
        }
      }
      if (name == currentName) {
        return {
          start: start,
          end: j
        }
      }
    }
    j += 1
  }
  return {
    start: -1,
    end: -1
  }
}


const attributeParser = (text: string): SSMLAttribute[] => {
  let res: SSMLAttribute[] = []
  let i = 0

  while (i < text.length) {
    if (text[i] != ' ') {
      let key = ''
      let value = ''
      while (i < text.length && text[i] != '=') {
        key += text[i]
        i += 1
      }
      i += 1
      while (text[i] == ' ') {
        i += 1
      }
      if (i < text.length && text[i] == '"') {
        i += 1
        while (i < text.length && text[i] != '"') {
          value += text[i]
          i += 1
        }
        if (i >= text.length) {
          throw new Error('attribute value not closed')
        }
      } else {
        throw new Error('attributes incorect')
      }
      let attr: SSMLAttribute = {
        name: key.trim(),
        value: value.trim()
      }
      if (!key) {
        throw new Error('attribute key empty')
      }
      res.push(attr)
    }
    i += 1
  }

  return res
}

interface CloseTagData {
  start: number,
  end: number
}

type SSMLNode = SSMLTag | SSMLText
type SSMLTag = {
  name: string
  attributes: SSMLAttribute[]
  children: SSMLNode[]
}
type SSMLText = string
type SSMLAttribute = { name: string; value: string }
