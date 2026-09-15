import type { RequestFilters } from "./filter-requests";
import type { AttentionFlag } from "./attention-flags";

const VALID_FLAGS: Exclude<AttentionFlag, null>[] = [
  "not_yet_collected",
  "needs_attention",
  "long_loan",
  "very_long_loan",
];

type SearchParamValue = string | string[] | undefined;

/**
 * Parses the requests dashboard's filter checkboxes from URL search
 * params. HTML checkboxes don't submit at all when unchecked, so a
 * bare GET form can't distinguish "the page was never
 * filtered/submitted yet" (should apply the §5.1 defaults: Pending +
 * Approved shown, no history) from "the form WAS submitted, with
 * some boxes genuinely left unchecked" (should show exactly what was
 * submitted, including all-unchecked). A hidden `submitted=1` field,
 * always present once the filter form has been used, resolves the
 * ambiguity.
 */
export function parseRequestFilters(
  sp: Record<string, SearchParamValue>,
): RequestFilters {
  const submitted = sp.submitted === "1";

  if (!submitted) {
    return {
      showPending: true,
      showApproved: true,
      showHistory: false,
      flags: [],
      titleSearch: "",
    };
  }

  const flagsParam = sp.flags;
  const flagsList = Array.isArray(flagsParam)
    ? flagsParam
    : typeof flagsParam === "string"
      ? flagsParam.split(",")
      : [];
  const flags = flagsList.filter((f): f is Exclude<AttentionFlag, null> =>
    (VALID_FLAGS as string[]).includes(f),
  );

  return {
    showPending: sp.pending === "1",
    showApproved: sp.approved === "1",
    showHistory: sp.history === "1",
    flags,
    titleSearch: typeof sp.q === "string" ? sp.q : "",
  };
}