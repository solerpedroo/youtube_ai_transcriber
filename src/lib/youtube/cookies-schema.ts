import { z } from "zod";
import { MAX_COOKIES_BYTES } from "./cookies-validate";

/** Optional Netscape cookies.txt body field shared by YouTube API routes. */
export const OptionalCookiesSchema = z.string().max(MAX_COOKIES_BYTES).optional();
