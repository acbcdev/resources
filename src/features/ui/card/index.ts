import Card, { card } from "./Card.astro";
import CardContent, { cardContent } from "./CardContent.astro";
import CardDescription, { cardDescription } from "./CardDescription.astro";
import CardFooter, { cardFooter } from "./CardFooter.astro";
import CardHeader, { cardHeader } from "./CardHeader.astro";
import CardTitle, { cardTitle } from "./CardTitle.astro";
import ResourceCard, {
	resourceCard,
	resourceCardImage,
	resourceCardBookmark,
	resourceCardBody,
	resourceCardMeta,
	resourceCardIcon,
	resourceCardCategory,
	resourceCardTitle,
	resourceCardTags,
	resourceCardTag,
	resourceCardDescription,
} from "./ResourceCard.astro";
import CompactCard, {
	compactCard,
	compactCardIcon,
	compactCardBody,
	compactCardTitle,
	compactCardDescription,
	compactCardBadge,
	compactCardIndicator,
	compactCardChevron,
} from "./CompactCard.astro";
import FeatureCard, {
	featureCard,
	featureCardBadge,
	featureCardTitle,
	featureCardDescription,
	featureCardCta,
} from "./FeatureCard.astro";
import CardSkeleton, { cardSkeleton, skeletonBlock } from "./CardSkeleton.astro";

const CardVariants = {
	card,
	cardContent,
	cardDescription,
	cardFooter,
	cardHeader,
	cardTitle,
	resourceCard,
	resourceCardImage,
	resourceCardBookmark,
	resourceCardBody,
	resourceCardMeta,
	resourceCardIcon,
	resourceCardCategory,
	resourceCardTitle,
	resourceCardTags,
	resourceCardTag,
	resourceCardDescription,
	compactCard,
	compactCardIcon,
	compactCardBody,
	compactCardTitle,
	compactCardDescription,
	compactCardBadge,
	compactCardIndicator,
	compactCardChevron,
	featureCard,
	featureCardBadge,
	featureCardTitle,
	featureCardDescription,
	featureCardCta,
	cardSkeleton,
	skeletonBlock,
};

export {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	CardVariants,
	ResourceCard,
	CompactCard,
	FeatureCard,
	CardSkeleton,
};

export default {
	Root: Card,
	Header: CardHeader,
	Footer: CardFooter,
	Title: CardTitle,
	Description: CardDescription,
	Content: CardContent,
	Resource: ResourceCard,
	Compact: CompactCard,
	Feature: FeatureCard,
	Skeleton: CardSkeleton,
};
