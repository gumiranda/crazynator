import type {
  FigmaNode,
  FigmaFile,
  DesignContext,
  ComponentAnalysis,
  ColorPalette,
  ColorToken,
  TypographySystem,
  SpacingSystem,
  LayoutSystem,
  DesignTokens,
  PageAnalysis,
  DesignMetadata,
  ComponentType,
  PropertyType,
  PageType,
  DesignStatus,
  FigmaColor,
  HSLColor,
  TextStyle,
  SpacingToken,
  ShadowToken,
  BorderToken,
  AccessibilityInfo,
  ResponsiveInfo
} from '@/types/figma';

export class FigmaDesignAnalyzer {
  private figmaFile: FigmaFile;
  private componentMap: Map<string, FigmaNode> = new Map();
  private styleMap: Map<string, any> = new Map();
  private colorMap: Map<string, ColorToken> = new Map();
  private textStyleMap: Map<string, TextStyle> = new Map();
  private spacingValues: number[] = [];
  private shadowValues: ShadowToken[] = [];
  private borderValues: BorderToken[] = [];

  constructor(figmaFile: FigmaFile) {
    this.figmaFile = figmaFile;
    this.initializeMaps();
  }

  /**
   * Initialize internal maps for analysis
   */
  private initializeMaps(): void {
    this.traverseNodes(this.figmaFile.document, (node) => {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        this.componentMap.set(node.id, node);
      }
      
      // Collect colors, spacing, and other design tokens
      this.extractDesignTokensFromNode(node);
    });

    // Process Figma styles
    Object.entries(this.figmaFile.styles || {}).forEach(([key, style]) => {
      this.styleMap.set(key, style);
    });
  }

  /**
   * Analyze the entire Figma file and extract design context
   */
  public analyze(): DesignContext {
    const components = this.analyzeComponents();
    const colorPalette = this.analyzeColorPalette();
    const typography = this.analyzeTypography();
    const spacing = this.analyzeSpacing();
    const layout = this.analyzeLayout();
    const designTokens = this.generateDesignTokens();
    const pages = this.analyzePages();
    const metadata = this.analyzeMetadata();

    return {
      file: {
        id: this.extractFileId(),
        name: this.figmaFile.name,
        url: `https://figma.com/file/${this.extractFileId()}`,
        lastModified: this.figmaFile.lastModified,
        version: this.figmaFile.version
      },
      components,
      colorPalette,
      typography,
      spacing,
      layout,
      designTokens,
      pages,
      metadata
    };
  }

  /**
   * Analyze components in the file
   */
  private analyzeComponents(): ComponentAnalysis[] {
    const components: ComponentAnalysis[] = [];

    this.componentMap.forEach((node, id) => {
      const analysis = this.analyzeComponent(node);
      if (analysis) {
        components.push(analysis);
      }
    });

    return components;
  }

  /**
   * Analyze a single component
   */
  private analyzeComponent(node: FigmaNode): ComponentAnalysis | null {
    if (!node.name) return null;

    const type = this.inferComponentType(node);
    const variants = this.extractComponentVariants(node);
    const properties = this.extractComponentProperties(node);
    const instances = this.findComponentInstances(node.id);
    const designTokens = this.extractComponentTokens(node);
    const accessibility = this.analyzeAccessibility(node);
    const responsive = this.analyzeResponsive(node);

    return {
      id: node.id,
      name: node.name,
      type,
      description: this.extractDescription(node),
      variants,
      properties,
      usageCount: instances.length,
      instances,
      designTokens,
      accessibility,
      responsive
    };
  }

  /**
   * Analyze color palette
   */
  private analyzeColorPalette(): ColorPalette {
    const colors = Array.from(this.colorMap.values());
    
    return {
      primary: this.categorizeColors(colors, 'primary'),
      secondary: this.categorizeColors(colors, 'secondary'),
      neutral: this.categorizeColors(colors, 'neutral'),
      semantic: {
        success: this.categorizeColors(colors, 'success'),
        warning: this.categorizeColors(colors, 'warning'),
        error: this.categorizeColors(colors, 'error'),
        info: this.categorizeColors(colors, 'info')
      },
      custom: this.categorizeColors(colors, 'custom')
    };
  }

  /**
   * Analyze typography system
   */
  private analyzeTypography(): TypographySystem {
    const textStyles = Array.from(this.textStyleMap.values());
    const fontFamilies = this.extractFontFamilies(textStyles);
    const hierarchy = this.categorizeTextStyles(textStyles);
    const scales = this.extractTypographyScales(textStyles);

    return {
      fontFamilies,
      textStyles,
      hierarchy,
      scales
    };
  }

  /**
   * Analyze spacing system
   */
  private analyzeSpacing(): SpacingSystem {
    const spacingValues = this.spacingValues.filter((value, index, arr) => 
      arr.indexOf(value) === index
    ).sort((a, b) => a - b);

    const baseUnit = this.inferBaseSpacingUnit(spacingValues);
    const scale = this.generateSpacingScale(baseUnit);
    const tokens = this.generateSpacingTokens(spacingValues);
    const patterns = this.findSpacingPatterns(spacingValues);

    return {
      baseUnit,
      scale,
      tokens,
      patterns
    };
  }

  /**
   * Analyze layout system
   */
  private analyzeLayout(): LayoutSystem {
    return {
      grids: this.extractGridSystems(),
      containers: this.extractContainerSystems(),
      breakpoints: this.extractBreakpoints(),
      layoutPatterns: this.findLayoutPatterns()
    };
  }

  /**
   * Generate design tokens
   */
  private generateDesignTokens(): DesignTokens {
    return {
      colors: this.generateColorTokens(),
      spacing: this.generateSpacingTokenMap(),
      typography: this.generateTypographyTokens(),
      shadows: this.generateShadowTokens(),
      borders: this.generateBorderTokens(),
      radii: this.generateRadiusTokens(),
      opacity: this.generateOpacityTokens(),
      zIndex: this.generateZIndexTokens()
    };
  }

  /**
   * Analyze pages in the file
   */
  private analyzePages(): PageAnalysis[] {
    const pages: PageAnalysis[] = [];
    
    if (this.figmaFile.document.children) {
      this.figmaFile.document.children.forEach(page => {
        if (page.type === 'CANVAS') {
          const analysis = this.analyzePage(page);
          if (analysis) {
            pages.push(analysis);
          }
        }
      });
    }

    return pages;
  }

  /**
   * Analyze file metadata
   */
  private analyzeMetadata(): DesignMetadata {
    return {
      version: this.figmaFile.version,
      lastModified: this.figmaFile.lastModified,
      contributors: this.extractContributors(),
      tags: this.extractTags(),
      status: this.inferDesignStatus(),
      libraries: this.extractLibraries(),
      plugins: this.extractPlugins()
    };
  }

  /**
   * Traverse all nodes in the document
   */
  private traverseNodes(node: FigmaNode, callback: (node: FigmaNode) => void): void {
    callback(node);
    
    if (node.children) {
      node.children.forEach(child => {
        this.traverseNodes(child, callback);
      });
    }
  }

  /**
   * Extract design tokens from a node
   */
  private extractDesignTokensFromNode(node: FigmaNode): void {
    // Extract colors
    if (node.fills) {
      node.fills.forEach(fill => {
        if (fill.type === 'SOLID' && fill.color) {
          this.addColorToken(fill.color, 'fill');
        }
      });
    }

    if (node.strokes) {
      node.strokes.forEach(stroke => {
        if (stroke.type === 'SOLID' && stroke.color) {
          this.addColorToken(stroke.color, 'stroke');
        }
      });
    }

    // Extract spacing
    if (node.paddingLeft !== undefined) this.spacingValues.push(node.paddingLeft);
    if (node.paddingRight !== undefined) this.spacingValues.push(node.paddingRight);
    if (node.paddingTop !== undefined) this.spacingValues.push(node.paddingTop);
    if (node.paddingBottom !== undefined) this.spacingValues.push(node.paddingBottom);
    if (node.itemSpacing !== undefined) this.spacingValues.push(node.itemSpacing);

    // Extract text styles
    if (node.style && node.type === 'TEXT') {
      this.addTextStyle(node);
    }

    // Extract shadows
    if (node.effects) {
      node.effects.forEach(effect => {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          this.addShadowToken(effect);
        }
      });
    }

    // Extract borders
    if (node.strokes && node.strokeWeight) {
      this.addBorderToken(node);
    }
  }

  /**
   * Add color token to the map
   */
  private addColorToken(color: FigmaColor, usage: 'fill' | 'stroke' | 'text' | 'background'): void {
    const hex = this.rgbToHex(color);
    const hsl = this.rgbToHsl(color);
    
    if (!this.colorMap.has(hex)) {
      this.colorMap.set(hex, {
        name: this.generateColorName(color),
        value: hex,
        hex,
        rgb: color,
        hsl,
        usage: []
      });
    }

    const token = this.colorMap.get(hex)!;
    const existingUsage = token.usage.find(u => u.type === usage);
    
    if (existingUsage) {
      existingUsage.count++;
    } else {
      token.usage.push({
        type: usage,
        count: 1,
        examples: []
      });
    }
  }

  /**
   * Add text style to the map
   */
  private addTextStyle(node: FigmaNode): void {
    if (!node.style) return;

    const key = this.generateTextStyleKey(node.style);
    if (!this.textStyleMap.has(key)) {
      this.textStyleMap.set(key, {
        name: node.name || 'Unnamed Style',
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fontWeight: this.parseFontWeight(node.style.fontPostScriptName),
        lineHeight: node.style.lineHeightPx,
        letterSpacing: node.style.letterSpacing,
        textCase: node.style.textCase,
        textDecoration: node.style.textDecoration,
        usage: 0,
        semantic: []
      });
    }

    const style = this.textStyleMap.get(key)!;
    style.usage++;
  }

  /**
   * Add shadow token
   */
  private addShadowToken(effect: any): void {
    if (!effect.visible || !effect.color) return;

    const shadow: ShadowToken = {
      name: `shadow-${this.shadowValues.length + 1}`,
      x: effect.offset?.x || 0,
      y: effect.offset?.y || 0,
      blur: effect.radius || 0,
      spread: effect.spread || 0,
      color: this.rgbToHex(effect.color),
      usage: 1
    };

    const existing = this.shadowValues.find(s => 
      s.x === shadow.x && s.y === shadow.y && 
      s.blur === shadow.blur && s.spread === shadow.spread
    );

    if (existing) {
      existing.usage++;
    } else {
      this.shadowValues.push(shadow);
    }
  }

  /**
   * Add border token
   */
  private addBorderToken(node: FigmaNode): void {
    if (!node.strokes || !node.strokeWeight) return;

    const stroke = node.strokes[0];
    if (!stroke.color) return;

    const border: BorderToken = {
      name: `border-${this.borderValues.length + 1}`,
      width: node.strokeWeight,
      style: 'solid', // Figma doesn't provide border style info
      color: this.rgbToHex(stroke.color),
      usage: 1
    };

    const existing = this.borderValues.find(b => 
      b.width === border.width && b.color === border.color
    );

    if (existing) {
      existing.usage++;
    } else {
      this.borderValues.push(border);
    }
  }

  /**
   * Infer component type based on node structure and naming
   */
  private inferComponentType(node: FigmaNode): ComponentType {
    const name = node.name.toLowerCase();
    
    if (name.includes('button')) return ComponentType.BUTTON;
    if (name.includes('input') || name.includes('field')) return ComponentType.INPUT;
    if (name.includes('card')) return ComponentType.CARD;
    if (name.includes('modal') || name.includes('dialog')) return ComponentType.MODAL;
    if (name.includes('nav') || name.includes('menu')) return ComponentType.NAVIGATION;
    if (name.includes('icon')) return ComponentType.ICON;
    if (name.includes('image') || name.includes('photo')) return ComponentType.IMAGE;
    if (node.type === 'TEXT') return ComponentType.TEXT;
    if (name.includes('form')) return ComponentType.FORM;
    if (name.includes('table') || name.includes('grid')) return ComponentType.TABLE;
    if (name.includes('chart') || name.includes('graph')) return ComponentType.CHART;
    if (name.includes('layout') || name.includes('container')) return ComponentType.LAYOUT;
    
    return ComponentType.CUSTOM;
  }

  /**
   * Categorize colors by semantic meaning
   */
  private categorizeColors(colors: ColorToken[], category: string): ColorToken[] {
    return colors.filter(color => {
      const name = color.name.toLowerCase();
      
      switch (category) {
        case 'primary':
          return name.includes('primary') || name.includes('brand') || 
                 (color.usage.reduce((sum, u) => sum + u.count, 0) > 10);
        case 'secondary':
          return name.includes('secondary') || name.includes('accent');
        case 'neutral':
          return name.includes('gray') || name.includes('grey') || 
                 name.includes('neutral') || name.includes('black') || 
                 name.includes('white');
        case 'success':
          return name.includes('success') || name.includes('green') || 
                 name.includes('positive');
        case 'warning':
          return name.includes('warning') || name.includes('yellow') || 
                 name.includes('amber');
        case 'error':
          return name.includes('error') || name.includes('red') || 
                 name.includes('danger');
        case 'info':
          return name.includes('info') || name.includes('blue');
        default:
          return true;
      }
    });
  }

  /**
   * Utility functions
   */
  private rgbToHex(color: FigmaColor): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private rgbToHsl(color: FigmaColor): HSLColor {
    const r = color.r;
    const g = color.g;
    const b = color.b;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
      a: color.a
    };
  }

  private generateColorName(color: FigmaColor): string {
    const hsl = this.rgbToHsl(color);
    
    if (hsl.s < 10) {
      if (hsl.l > 90) return 'white';
      if (hsl.l < 10) return 'black';
      return `gray-${Math.round(hsl.l / 10) * 10}`;
    }
    
    const hue = hsl.h;
    let colorName = 'custom';
    
    if (hue >= 0 && hue < 15) colorName = 'red';
    else if (hue >= 15 && hue < 45) colorName = 'orange';
    else if (hue >= 45 && hue < 75) colorName = 'yellow';
    else if (hue >= 75 && hue < 165) colorName = 'green';
    else if (hue >= 165 && hue < 195) colorName = 'cyan';
    else if (hue >= 195 && hue < 255) colorName = 'blue';
    else if (hue >= 255 && hue < 285) colorName = 'purple';
    else if (hue >= 285 && hue < 315) colorName = 'magenta';
    else if (hue >= 315 && hue < 345) colorName = 'pink';
    else colorName = 'red';
    
    const lightness = Math.round(hsl.l / 10) * 10;
    return `${colorName}-${lightness}`;
  }

  private generateTextStyleKey(style: any): string {
    return `${style.fontFamily}-${style.fontSize}-${style.fontPostScriptName}`;
  }

  private parseFontWeight(fontPostScriptName: string): number {
    if (fontPostScriptName.includes('Light')) return 300;
    if (fontPostScriptName.includes('Regular')) return 400;
    if (fontPostScriptName.includes('Medium')) return 500;
    if (fontPostScriptName.includes('SemiBold')) return 600;
    if (fontPostScriptName.includes('Bold')) return 700;
    if (fontPostScriptName.includes('ExtraBold')) return 800;
    if (fontPostScriptName.includes('Black')) return 900;
    return 400;
  }

  private extractFileId(): string {
    // This would typically come from the URL or API response
    return 'figma-file-id';
  }

  // Placeholder implementations for complex analysis methods
  private extractComponentVariants(node: FigmaNode): any[] { return []; }
  private extractComponentProperties(node: FigmaNode): any[] { return []; }
  private findComponentInstances(id: string): any[] { return []; }
  private extractComponentTokens(node: FigmaNode): string[] { return []; }
  private analyzeAccessibility(node: FigmaNode): AccessibilityInfo {
    return {
      roles: [],
      contrast: { aa: false, aaa: false, ratio: 0 },
      focusable: false,
      semantics: { states: [] }
    };
  }
  private analyzeResponsive(node: FigmaNode): ResponsiveInfo {
    return {
      breakpoints: [],
      behavior: { resize: 'fixed', align: '', spacing: '' },
      constraints: []
    };
  }
  private extractDescription(node: FigmaNode): string { return ''; }
  private extractFontFamilies(styles: TextStyle[]): any[] { return []; }
  private categorizeTextStyles(styles: TextStyle[]): any { return { headings: [], body: [], captions: [], buttons: [] }; }
  private extractTypographyScales(styles: TextStyle[]): any[] { return []; }
  private inferBaseSpacingUnit(values: number[]): number { return 8; }
  private generateSpacingScale(baseUnit: number): number[] { return []; }
  private generateSpacingTokens(values: number[]): SpacingToken[] { return []; }
  private findSpacingPatterns(values: number[]): any[] { return []; }
  private extractGridSystems(): any[] { return []; }
  private extractContainerSystems(): any[] { return []; }
  private extractBreakpoints(): any[] { return []; }
  private findLayoutPatterns(): any[] { return []; }
  private generateColorTokens(): { [key: string]: string } { return {}; }
  private generateSpacingTokenMap(): { [key: string]: number } { return {}; }
  private generateTypographyTokens(): { [key: string]: TextStyle } { return {}; }
  private generateShadowTokens(): { [key: string]: ShadowToken } { return {}; }
  private generateBorderTokens(): { [key: string]: BorderToken } { return {}; }
  private generateRadiusTokens(): { [key: string]: number } { return {}; }
  private generateOpacityTokens(): { [key: string]: number } { return {}; }
  private generateZIndexTokens(): { [key: string]: number } { return {}; }
  private analyzePage(page: FigmaNode): PageAnalysis | null { return null; }
  private extractContributors(): any[] { return []; }
  private extractTags(): string[] { return []; }
  private inferDesignStatus(): DesignStatus { return DesignStatus.DRAFT; }
  private extractLibraries(): any[] { return []; }
  private extractPlugins(): any[] { return []; }
}

/**
 * Analyze a Figma file and extract design context
 */
export function analyzeFigmaFile(figmaFile: FigmaFile): DesignContext {
  const analyzer = new FigmaDesignAnalyzer(figmaFile);
  return analyzer.analyze();
}