import { inspect } from "util";

export function filterEmojis(text: string | undefined) {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

  return text?.replace(emojiRegex, "");
}

export async function sleep(ms: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const pipe =
  (...functions: Function[]) =>
  async (input: any) => {
    let result = input;
    for (const func of functions) {
      result = await func(result);
    }
    return result;
  };

export function randomInRange(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function includesArray(
  needles: (string | RegExp)[],
  haystack: string | undefined
): boolean {
  if (!haystack) {
    return false;
  }
  return needles.some((needle) => {
    if (typeof needle === "string") {
      return haystack.includes(needle);
    }

    if (needle instanceof RegExp) {
      return needle.test(haystack);
    }

    throw new Error("Invalid needle", needle);
  });
}

export function encodeURIComponentProperly(uri: string): string {
  return encodeURIComponent(uri).replace("(", "%28").replace(")", "%29");
}
