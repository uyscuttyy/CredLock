import { keccak256, stringToHex } from 'viem'
import { isValidAssetId } from './types'

/**
 * A name hashes to its id in the browser: the same name always yields
 * the same id on every machine. Pasted 0x ids pass through untouched.
 */
export function nameToAssetId(input: string): string {
  const trimmed = input.trim()
  if (trimmed === '') return ''
  if (isValidAssetId(trimmed)) return trimmed
  return keccak256(stringToHex(trimmed))
}
