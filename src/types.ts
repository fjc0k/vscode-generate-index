import * as changeCase from 'change-case'
import { GlobbyOptions } from 'globby'

export interface ParsedPath {
  /** The relative file path without extension, such as `./api` */
  path: string
  /** The file name without extension, such as `api` */
  name: string
  /** The file extension, such as `.js`*/
  ext: string
}

export type ChangeCase = typeof changeCase

export interface ExtraInfo {
  /** total number of items */
  total: number
  /** index of current item */
  index: number
  /**
   * if current item is the first
   * @deprecated please use isFirst
   */
  first: boolean
  /**
   * if current item is the last
   * @deprecated please use isLast
   */
  last: boolean
  /** if current item is the first */
  isFirst: boolean
  /** if current item is the last */
  isLast: boolean
  /** if current item is a directory */
  isDir: boolean
  /** if current item is a file */
  isFile: boolean
}

export interface ExtraInfoRe {
  /** total number of matches */
  total: number
  /** index of current match */
  index: number
  /** if current item is the first */
  isFirst: boolean
  /** if current item is the last */
  isLast: boolean
}

export type Pattern = string

export type CodeGenerator = (
  parsedPath: ParsedPath,
  changeCase: ChangeCase,
  extraInfo: ExtraInfo,
) => string

export type CodeGeneratorRe = (
  matches: string[],
  changeCase: ChangeCase,
  extraInfo: ExtraInfoRe,
) => string

export interface Marker {
  indent: string
  start: number
  end: number
  patterns: Pattern[]
  codeGenerator: CodeGenerator
  globbyOptions: GlobbyOptions
  isRe: boolean
  fileRe: string
  codeGeneratorRe: CodeGeneratorRe
  regionRe: RegExp
  matchRe: RegExp
}
