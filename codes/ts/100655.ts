import { type Review } from ".prisma/client";
import { ReviewFormSchema, type ReviewForm } from "~/types/Review.types";

import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";
import { ProfanityError } from "~/types/errors";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export default async function submitForm(values: ReviewForm) {
  "use server";

  if (values.honey) {
    throw new Error("Error submitting form. Please try again later.");
  }

  ReviewFormSchema.parse(values);

  if (values.company === "Other" && values.companyOther) {
    values.company = values.companyOther;
  }

  values.company = values.company[0]!.toUpperCase() + values.company.slice(1);

  // Just to be cool can add extra checks with chatgpt

  // profanity filters
  if (
    matcher.hasMatch(values.company) ||
    matcher.hasMatch(values.position) ||
    matcher.hasMatch(values.detailed)
  ) {
    throw new ProfanityError(
      matcher.hasMatch(values.company)
        ? values.company
        : matcher.hasMatch(values.detailed)
          ? values.detailed
          : values.position,
    );
  }

  // Save form to database

  // Return form info
  return values as unknown as Review;
}
