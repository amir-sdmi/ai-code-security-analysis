/**
 * Generated with Cursor AI. These types are a refactor from the original
 * types to ensure that we can extend the card types and avoid duplication.
 */

// Card type enums
export enum CardTypeEnum {
	Article = 'article',
	Social = 'social',
	SublimeImage = 'sublime_image',
	SublimePost = 'sublime_post',
	SublimeVideo = 'sublime_video',
}

export enum TagTypeEnum {
	Productivity = 'Productivity',
	JustForFun = 'Just for Fun',
	Wellness = 'Wellness',
	Inspiration = 'Inspiration',
	ThoughtProvoking = 'Thought-Provoking',
}

// Common properties that ALL card types share
export interface BasicCard {
	id: number;
	card_type?: CardTypeEnum;
	/** @format date-time */
	created_at: string;
	/** @format date-time */
	updated_at: string;
	related: number[];
	notes: Note[];
	/**
	 * @maxLength 100
	 * @pattern ^[-a-zA-Z0-9_]+$
	 */
	slug?: string | null;
}

// Common content properties that most content types share
export interface BasicContent {
	card_type?: CardTypeEnum;
	title?: string | null;
	description?: string | null;
	author?: string | null;
	// Added tag type for improving UI
	tag?: TagTypeEnum;
}

// Article specific content
export interface ArticleContent extends BasicContent {
	card_type?: CardTypeEnum.Article;
	/** @format uri */
	url: string;
	/** @format uri */
	thumbnail?: string | null;
}

// Social specific content
export interface SocialContent extends BasicContent {
	card_type?: CardTypeEnum.Social;
	/** @format uri */
	url: string;
	text?: string | null;
	images?: string[] | null;
	videos?: VideoURL[] | null;
}

// Sublime Image specific content
export interface SublimeImageContent extends BasicContent {
	card_type?: CardTypeEnum.SublimeImage;
	/** @format uri */
	url: string;
	/** @format uri */
	thumbnail?: string | null;
}

// Sublime Post specific content
export interface SublimePostContent extends BasicContent {
	card_type?: CardTypeEnum.SublimePost;
	text?: string | null;
	images?: string[] | null;
	videos?: VideoURL[] | null;
}

// Sublime Video specific content
export interface SublimeVideoContent extends BasicContent {
	card_type?: CardTypeEnum.SublimeVideo;
	/** @format uri */
	url: string;
	/** @format uri */
	thumbnail: string; // Required for video
}

// Specific card types extending BasicCard
export interface ArticleCard extends BasicCard {
	card_type?: CardTypeEnum.Article;
	content: ArticleContent;
}

export interface SocialCard extends BasicCard {
	card_type?: CardTypeEnum.Social;
	content: SocialContent;
}

export interface SublimeImageCard extends BasicCard {
	card_type?: CardTypeEnum.SublimeImage;
	content: SublimeImageContent;
}

export interface SublimePostCard extends BasicCard {
	card_type?: CardTypeEnum.SublimePost;
	content: SublimePostContent;
}

export interface SublimeVideoCard extends BasicCard {
	card_type?: CardTypeEnum.SublimeVideo;
	content: SublimeVideoContent;
}

// Union type for all cards
export type Card =
	| SocialCard
	| ArticleCard
	| SublimePostCard
	| SublimeImageCard
	| SublimeVideoCard;

// Supporting types
export interface Note {
	id: number;
	/** @maxLength 255 */
	text: string;
	/** @format date-time */
	created_at: string;
	/** @format date-time */
	updated_at: string;
	card: number;
}

export interface VideoURL {
	/** @format uri */
	video_url: string;
	/** @format uri */
	thumbnail?: string | null;
}

// Utility type to get content type from card type
export type CardContent<T extends Card> = T['content'];

// Utility type to get card type from card
export type CardType<T extends Card> = T['card_type'];
