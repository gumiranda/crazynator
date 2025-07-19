// Figma API Types
export interface FigmaFile {
  document: FigmaNode;
  components: { [key: string]: FigmaComponent };
  schemaVersion: number;
  styles: { [key: string]: FigmaStyle };
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  backgroundColor?: FigmaColor;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeAlign?: string;
  cornerRadius?: number;
  constraints?: FigmaLayoutConstraint;
  layoutAlign?: string;
  layoutGrow?: number;
  effects?: FigmaEffect[];
  absoluteBoundingBox?: FigmaRectangle;
  size?: FigmaVector;
  relativeTransform?: FigmaTransform;
  clipsContent?: boolean;
  layoutMode?: string;
  counterAxisSizingMode?: string;
  primaryAxisSizingMode?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  characters?: string;
  style?: FigmaTypeStyle;
  characterStyleOverrides?: number[];
  styleOverrideTable?: { [key: string]: FigmaTypeStyle };
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks: FigmaDocumentationLink[];
}

export interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  styleType: string;
  remote: boolean;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaPaint {
  type: string;
  color?: FigmaColor;
  gradientHandlePositions?: FigmaVector[];
  gradientStops?: FigmaColorStop[];
  scaleMode?: string;
  imageTransform?: FigmaTransform;
  scalingFactor?: number;
  imageRef?: string;
  gifRef?: string;
  videoRef?: string;
  filters?: FigmaImageFilters;
}

export interface FigmaColorStop {
  color: FigmaColor;
  position: number;
}

export interface FigmaVector {
  x: number;
  y: number;
}

export interface FigmaRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaTransform {
  0: number[];
  1: number[];
  2: number[];
}

export interface FigmaLayoutConstraint {
  vertical: string;
  horizontal: string;
}

export interface FigmaEffect {
  type: string;
  visible: boolean;
  radius?: number;
  color?: FigmaColor;
  offset?: FigmaVector;
  spread?: number;
  showShadowBehindNode?: boolean;
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontPostScriptName: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listSpacing?: number;
  hangingPunctuation?: boolean;
  hangingList?: boolean;
  fontSize: number;
  textDecoration?: string;
  textCase?: string;
  lineHeightPx: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit: string;
  letterSpacing: number;
  fills: FigmaPaint[];
  hyperlink?: FigmaHyperlink;
  opentypeFlags?: { [flag: string]: number };
}

export interface FigmaHyperlink {
  type: string;
  url: string;
}

export interface FigmaDocumentationLink {
  uri: string;
}

export interface FigmaImageFilters {
  exposure?: number;
  highlights?: number;
  shadows?: number;
  saturation?: number;
  temperature?: number;
  tint?: number;
  contrast?: number;
}

// Design Context Types
export interface DesignContext {
  file: {
    id: string;
    name: string;
    url: string;
    lastModified: string;
    version: string;
  };
  components: ComponentAnalysis[];
  colorPalette: ColorPalette;
  typography: TypographySystem;
  spacing: SpacingSystem;
  layout: LayoutSystem;
  designTokens: DesignTokens;
  pages: PageAnalysis[];
  metadata: DesignMetadata;
}

export interface ComponentAnalysis {
  id: string;
  name: string;
  type: ComponentType;
  description?: string;
  variants: ComponentVariant[];
  properties: ComponentProperty[];
  usageCount: number;
  instances: ComponentInstance[];
  designTokens: string[];
  accessibility: AccessibilityInfo;
  responsive: ResponsiveInfo;
}

export interface ComponentVariant {
  id: string;
  name: string;
  properties: { [key: string]: string };
  previewUrl?: string;
}

export interface ComponentProperty {
  name: string;
  type: PropertyType;
  defaultValue?: any;
  options?: string[];
  description?: string;
}

export interface ComponentInstance {
  id: string;
  pageId: string;
  pageName: string;
  coordinates: FigmaVector;
  overrides: { [key: string]: any };
}

export interface ColorPalette {
  primary: ColorToken[];
  secondary: ColorToken[];
  neutral: ColorToken[];
  semantic: SemanticColors;
  custom: ColorToken[];
}

export interface ColorToken {
  name: string;
  value: string;
  hex: string;
  rgb: FigmaColor;
  hsl: HSLColor;
  usage: ColorUsage[];
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export interface ColorUsage {
  type: 'fill' | 'stroke' | 'text' | 'background';
  count: number;
  examples: string[];
}

export interface SemanticColors {
  success: ColorToken[];
  warning: ColorToken[];
  error: ColorToken[];
  info: ColorToken[];
}

export interface TypographySystem {
  fontFamilies: FontFamily[];
  textStyles: TextStyle[];
  hierarchy: TypographyHierarchy;
  scales: TypographyScale[];
}

export interface FontFamily {
  name: string;
  weights: number[];
  styles: string[];
  usage: number;
}

export interface TextStyle {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textCase?: string;
  textDecoration?: string;
  usage: number;
  semantic: string[];
}

export interface TypographyHierarchy {
  headings: TextStyle[];
  body: TextStyle[];
  captions: TextStyle[];
  buttons: TextStyle[];
}

export interface TypographyScale {
  name: string;
  baseSize: number;
  ratio: number;
  sizes: number[];
}

export interface SpacingSystem {
  baseUnit: number;
  scale: number[];
  tokens: SpacingToken[];
  patterns: SpacingPattern[];
}

export interface SpacingToken {
  name: string;
  value: number;
  usage: SpacingUsage[];
}

export interface SpacingUsage {
  type: 'margin' | 'padding' | 'gap' | 'position';
  direction?: 'top' | 'right' | 'bottom' | 'left' | 'vertical' | 'horizontal' | 'all';
  count: number;
}

export interface SpacingPattern {
  name: string;
  description: string;
  values: number[];
  frequency: number;
}

export interface LayoutSystem {
  grids: GridSystem[];
  containers: ContainerSystem[];
  breakpoints: Breakpoint[];
  layoutPatterns: LayoutPattern[];
}

export interface GridSystem {
  name: string;
  columns: number;
  gutter: number;
  margin: number;
  maxWidth?: number;
  usage: number;
}

export interface ContainerSystem {
  name: string;
  maxWidth: number;
  padding: number;
  breakpoints: { [key: string]: number };
}

export interface Breakpoint {
  name: string;
  value: number;
  usage: number;
}

export interface LayoutPattern {
  name: string;
  description: string;
  structure: LayoutStructure;
  frequency: number;
}

export interface LayoutStructure {
  type: 'flexbox' | 'grid' | 'absolute' | 'auto';
  direction?: 'row' | 'column';
  wrap?: boolean;
  justify?: string;
  align?: string;
  gap?: number;
}

export interface DesignTokens {
  colors: { [key: string]: string };
  spacing: { [key: string]: number };
  typography: { [key: string]: TextStyle };
  shadows: { [key: string]: ShadowToken };
  borders: { [key: string]: BorderToken };
  radii: { [key: string]: number };
  opacity: { [key: string]: number };
  zIndex: { [key: string]: number };
}

export interface ShadowToken {
  name: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  usage: number;
}

export interface BorderToken {
  name: string;
  width: number;
  style: string;
  color: string;
  usage: number;
}

export interface PageAnalysis {
  id: string;
  name: string;
  type: PageType;
  components: string[];
  layout: LayoutStructure;
  colorUsage: ColorUsage[];
  typographyUsage: string[];
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  type: 'comment' | 'spec' | 'redline' | 'note';
  content: string;
  position: FigmaVector;
  author?: string;
  timestamp?: string;
}

export interface DesignMetadata {
  version: string;
  lastModified: string;
  contributors: Contributor[];
  tags: string[];
  status: DesignStatus;
  libraries: LibraryInfo[];
  plugins: PluginInfo[];
}

export interface Contributor {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  lastActivity: string;
}

export interface LibraryInfo {
  id: string;
  name: string;
  version: string;
  components: number;
  styles: number;
}

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  usage: number;
}

export interface AccessibilityInfo {
  name?: string;
  description?: string;
  roles: string[];
  contrast: ContrastInfo;
  focusable: boolean;
  semantics: SemanticInfo;
}

export interface ContrastInfo {
  aa: boolean;
  aaa: boolean;
  ratio: number;
}

export interface SemanticInfo {
  role?: string;
  label?: string;
  description?: string;
  states: string[];
}

export interface ResponsiveInfo {
  breakpoints: string[];
  behavior: ResponsiveBehavior;
  constraints: LayoutConstraint[];
}

export interface ResponsiveBehavior {
  resize: 'fixed' | 'hug' | 'fill';
  align: string;
  spacing: string;
}

export interface LayoutConstraint {
  type: string;
  value: number | string;
  condition?: string;
}

// Enums
export enum ComponentType {
  BUTTON = 'button',
  INPUT = 'input',
  CARD = 'card',
  MODAL = 'modal',
  NAVIGATION = 'navigation',
  LAYOUT = 'layout',
  ICON = 'icon',
  IMAGE = 'image',
  TEXT = 'text',
  FORM = 'form',
  TABLE = 'table',
  CHART = 'chart',
  CUSTOM = 'custom'
}

export enum PropertyType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  COLOR = 'color',
  VARIANT = 'variant',
  INSTANCE_SWAP = 'instance_swap',
  COMPONENT = 'component'
}

export enum PageType {
  WIREFRAME = 'wireframe',
  MOCKUP = 'mockup',
  PROTOTYPE = 'prototype',
  SPEC = 'spec',
  COMPONENT_LIBRARY = 'component_library',
  STYLE_GUIDE = 'style_guide',
  OTHER = 'other'
}

export enum DesignStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Import Configuration
export interface FigmaImportConfig {
  fileUrl: string;
  accessToken: string;
  includeComponents: boolean;
  includeStyles: boolean;
  includeAssets: boolean;
  extractTokens: boolean;
  generateCode: boolean;
  outputFormat: OutputFormat[];
  plugins: PluginConfig[];
}

export interface PluginConfig {
  name: string;
  enabled: boolean;
  options: { [key: string]: any };
}

export enum OutputFormat {
  JSON = 'json',
  CSS = 'css',
  SCSS = 'scss',
  TOKENS = 'tokens',
  REACT = 'react',
  VUE = 'vue',
  ANGULAR = 'angular'
}

// Import Results
export interface FigmaImportResult {
  success: boolean;
  data?: DesignContext;
  errors?: ImportError[];
  warnings?: ImportWarning[];
  stats: ImportStats;
}

export interface ImportError {
  code: string;
  message: string;
  details?: any;
}

export interface ImportWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface ImportStats {
  totalNodes: number;
  processedNodes: number;
  componentsFound: number;
  stylesExtracted: number;
  assetsDownloaded: number;
  tokensGenerated: number;
  processingTime: number;
}