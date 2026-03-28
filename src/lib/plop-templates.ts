/**
 * PlopJS-inspired template system for token-efficient code generation.
 *
 * Instead of having the AI generate every line of boilerplate from scratch,
 * we use pre-built templates with handlebars-style placeholders.
 * The AI only needs to specify template name + variables = massive token savings.
 */

export interface PlopTemplate {
  name: string;
  description: string;
  category: 'page' | 'component' | 'layout' | 'feature' | 'api' | 'hook';
  uiLibrary?: string; // optional: specific to a UI library
  variables: PlopVariable[];
  files: PlopTemplateFile[];
}

export interface PlopVariable {
  name: string;
  type: 'string' | 'boolean' | 'array' | 'select';
  description: string;
  default?: string | boolean | string[];
  options?: string[]; // for select type
}

export interface PlopTemplateFile {
  path: string; // supports {{handlebars}} e.g. "app/{{kebabCase name}}/page.tsx"
  content: string;
}

// Handlebars-like helpers
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function pascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function camelCase(str: string): string {
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

const helpers: Record<string, (str: string) => string> = {
  kebabCase,
  pascalCase,
  camelCase,
  upperCase: (s: string) => s.toUpperCase(),
  lowerCase: (s: string) => s.toLowerCase(),
};

/**
 * Resolve template placeholders like {{pascalCase name}} or {{description}}
 */
export function resolveTemplate(
  template: string,
  variables: Record<string, string | boolean | string[]>,
): string {
  // Handle helper functions: {{helperName varName}}
  let result = template.replace(/\{\{(\w+)\s+(\w+)\}\}/g, (_, helperName, varName) => {
    const helper = helpers[helperName];
    const value = variables[varName];
    if (helper && typeof value === 'string') {
      return helper(value);
    }
    // If no helper found, treat first word as variable name
    if (typeof variables[helperName] === 'string') {
      return variables[helperName] as string;
    }
    return `{{${helperName} ${varName}}}`;
  });

  // Handle simple variables: {{varName}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
    const value = variables[varName];
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (Array.isArray(value)) return value.join(', ');
    return `{{${varName}}}`;
  });

  // Handle conditionals: {{#if varName}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, varName, content) => {
    const value = variables[varName];
    if (value && value !== 'false' && value !== '') {
      return content;
    }
    return '';
  });

  // Handle each loops: {{#each varName}}...{{/each}}
  result = result.replace(
    /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_, varName, content) => {
      const value = variables[varName];
      if (Array.isArray(value)) {
        return value.map((item) => content.replace(/\{\{this\}\}/g, item)).join('\n');
      }
      return '';
    },
  );

  return result;
}

/**
 * Generate files from a template + variables
 */
export function generateFromTemplate(
  template: PlopTemplate,
  variables: Record<string, string | boolean | string[]>,
): { path: string; content: string }[] {
  return template.files.map((file) => ({
    path: resolveTemplate(file.path, variables),
    content: resolveTemplate(file.content, variables),
  }));
}

// ============================================================================
// BUILT-IN TEMPLATES
// ============================================================================

export const BUILT_IN_TEMPLATES: PlopTemplate[] = [
  // ---- LAYOUT TEMPLATES ----
  {
    name: 'dashboard-layout',
    description: 'Dashboard layout with sidebar, header, and main content area',
    category: 'layout',
    uiLibrary: 'kibo-ui',
    variables: [
      { name: 'name', type: 'string', description: 'Dashboard name', default: 'Dashboard' },
      {
        name: 'sidebarItems',
        type: 'array',
        description: 'Sidebar navigation items',
        default: ['Home', 'Analytics', 'Settings'],
      },
      { name: 'hasSearch', type: 'boolean', description: 'Include search bar', default: true },
      {
        name: 'hasNotifications',
        type: 'boolean',
        description: 'Include notifications',
        default: true,
      },
    ],
    files: [
      {
        path: 'app/{{kebabCase name}}/layout.tsx',
        content: `"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboardIcon,
  MenuIcon,
  XIcon,
  {{#if hasSearch}}SearchIcon,{{/if}}
  {{#if hasNotifications}}BellIcon,{{/if}}
} from "lucide-react";
{{#if hasSearch}}
import { Input } from "@/components/ui/input";
{{/if}}

const sidebarItems = [
  {{#each sidebarItems}}
  { label: "{{this}}", href: "/{{kebabCase name}}/{{this}}" },
  {{/each}}
];

export default function {{pascalCase name}}Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={cn(
        "border-r bg-sidebar transition-all duration-300",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">{{name}}</h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <nav className="p-2 space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <LayoutDashboardIcon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="flex items-center gap-4 border-b px-4 py-3">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <MenuIcon className="h-4 w-4" />
            </Button>
          )}
          {{#if hasSearch}}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" />
            </div>
          </div>
          {{/if}}
          <div className="ml-auto flex items-center gap-2">
            {{#if hasNotifications}}
            <Button variant="ghost" size="icon">
              <BellIcon className="h-4 w-4" />
            </Button>
            {{/if}}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
`,
      },
      {
        path: 'app/{{kebabCase name}}/page.tsx',
        content: `"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function {{pascalCase name}}Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{{name}}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Revenue", value: "$45,231.89", change: "+20.1%" },
          { title: "Subscriptions", value: "+2350", change: "+180.1%" },
          { title: "Sales", value: "+12,234", change: "+19%" },
          { title: "Active Now", value: "+573", change: "+201" },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
`,
      },
    ],
  },

  // ---- LANDING PAGE TEMPLATE ----
  {
    name: 'landing-page',
    description: 'Complete landing page with hero, features, pricing, and CTA sections',
    category: 'page',
    uiLibrary: 'aceternity',
    variables: [
      { name: 'name', type: 'string', description: 'Product/App name', default: 'MyApp' },
      {
        name: 'tagline',
        type: 'string',
        description: 'Hero tagline',
        default: 'Build something amazing',
      },
      {
        name: 'features',
        type: 'array',
        description: 'Feature names',
        default: ['Fast', 'Secure', 'Scalable'],
      },
      { name: 'hasPricing', type: 'boolean', description: 'Include pricing section', default: true },
      { name: 'darkMode', type: 'boolean', description: 'Use dark theme', default: true },
    ],
    files: [
      {
        path: 'app/page.tsx',
        content: `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, CheckIcon, SparklesIcon, ZapIcon, ShieldIcon } from "lucide-react";

const features = [
  {{#each features}}
  { title: "{{this}}", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", icon: ZapIcon },
  {{/each}}
];

{{#if hasPricing}}
const pricingPlans = [
  { name: "Free", price: "$0", features: ["Basic features", "1 project", "Community support"] },
  { name: "Pro", price: "$29", features: ["All features", "Unlimited projects", "Priority support", "Analytics"], popular: true },
  { name: "Enterprise", price: "Custom", features: ["Everything in Pro", "Custom integrations", "Dedicated support", "SLA"] },
];
{{/if}}

export default function LandingPage() {
  return (
    <div className="min-h-screen {{#if darkMode}}bg-black text-white{{/if}}">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b {{#if darkMode}}border-white/10{{/if}}">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">{{name}}</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost">Features</Button>
          {{#if hasPricing}}<Button variant="ghost">Pricing</Button>{{/if}}
          <Button>Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 space-y-6">
        <Badge variant="secondary" className="text-sm">Now in Beta</Badge>
        <h1 className="text-5xl md:text-7xl font-bold max-w-4xl leading-tight">
          {{tagline}}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          The modern platform that helps you build, ship, and scale your ideas faster than ever.
        </p>
        <div className="flex gap-4">
          <Button size="lg">
            Get Started Free <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">Live Demo</Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="{{#if darkMode}}bg-white/5 border-white/10{{/if}}">
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {{#if hasPricing}}
      {/* Pricing */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <Card key={plan.name} className={\`\${plan.popular ? "border-primary ring-2 ring-primary" : ""} {{#if darkMode}}bg-white/5 border-white/10{{/if}}\`}>
              <CardHeader>
                {plan.popular && <Badge className="w-fit mb-2">Most Popular</Badge>}
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-3xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant={plan.popular ? "default" : "outline"}>
                  Choose {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {{/if}}

      {/* Footer */}
      <footer className="border-t {{#if darkMode}}border-white/10{{/if}} px-6 py-8 text-center text-muted-foreground">
        <p>&copy; 2024 {{name}}. All rights reserved.</p>
      </footer>
    </div>
  );
}
`,
      },
    ],
  },

  // ---- AUTH PAGE TEMPLATE ----
  {
    name: 'auth-page',
    description: 'Authentication page with login/register forms',
    category: 'page',
    variables: [
      { name: 'name', type: 'string', description: 'App name', default: 'MyApp' },
      {
        name: 'hasOAuth',
        type: 'boolean',
        description: 'Include OAuth buttons (Google, GitHub)',
        default: true,
      },
      {
        name: 'hasRegister',
        type: 'boolean',
        description: 'Include registration tab',
        default: true,
      },
    ],
    files: [
      {
        path: 'app/auth/page.tsx',
        content: `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
{{#if hasRegister}}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
{{/if}}
import { SparklesIcon } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle auth
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <SparklesIcon className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">{{name}}</span>
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {{#if hasRegister}}
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
          {{/if}}
              <form onSubmit={handleSubmit} className="space-y-4">
                {{#if hasOAuth}}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" type="button">Google</Button>
                  <Button variant="outline" type="button">GitHub</Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                </div>
                {{/if}}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Sign In</Button>
              </form>
          {{#if hasRegister}}
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Name</Label>
                  <Input id="reg-name" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full">Create Account</Button>
              </form>
            </TabsContent>
          </Tabs>
          {{/if}}
        </CardContent>
      </Card>
    </div>
  );
}
`,
      },
    ],
  },

  // ---- CRUD TABLE TEMPLATE ----
  {
    name: 'crud-table',
    description: 'Data table with create, read, update, delete operations',
    category: 'feature',
    uiLibrary: 'kibo-ui',
    variables: [
      { name: 'name', type: 'string', description: 'Entity name (e.g. User, Product)', default: 'Item' },
      {
        name: 'fields',
        type: 'array',
        description: 'Field names for the entity',
        default: ['name', 'email', 'status'],
      },
    ],
    files: [
      {
        path: 'app/{{kebabCase name}}s/page.tsx',
        content: `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from "lucide-react";

interface {{pascalCase name}} {
  id: string;
  {{#each fields}}
  {{this}}: string;
  {{/each}}
}

const initial{{pascalCase name}}s: {{pascalCase name}}[] = [
  { id: "1", {{#each fields}}{{this}}: "Sample {{this}}", {{/each}} },
  { id: "2", {{#each fields}}{{this}}: "Another {{this}}", {{/each}} },
];

export default function {{pascalCase name}}sPage() {
  const [items, setItems] = useState<{{pascalCase name}}[]>(initial{{pascalCase name}}s);
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<{{pascalCase name}} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filtered = items.filter((item) =>
    Object.values(item).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = (item: {{pascalCase name}}) => {
    if (editItem) {
      setItems(items.map((i) => (i.id === item.id ? item : i)));
    } else {
      setItems([...items, { ...item, id: Date.now().toString() }]);
    }
    setEditItem(null);
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{{pascalCase name}}s</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditItem(null)}>
              <PlusIcon className="h-4 w-4 mr-2" /> Add {{pascalCase name}}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit" : "Add"} {{pascalCase name}}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSave({
                id: editItem?.id || "",
                {{#each fields}}
                {{this}}: formData.get("{{this}}") as string,
                {{/each}}
              });
            }} className="space-y-4">
              {{#each fields}}
              <div className="space-y-2">
                <Label htmlFor="{{this}}">{{this}}</Label>
                <Input id="{{this}}" name="{{this}}" defaultValue={editItem?.{{this}} || ""} />
              </div>
              {{/each}}
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {{#each fields}}
            <TableHead>{{this}}</TableHead>
            {{/each}}
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow key={item.id}>
              {{#each fields}}
              <TableCell>{item.{{this}}}</TableCell>
              {{/each}}
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setIsDialogOpen(true); }}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
`,
      },
    ],
  },

  // ---- SETTINGS PAGE TEMPLATE ----
  {
    name: 'settings-page',
    description: 'Settings page with tabbed sections',
    category: 'page',
    variables: [
      { name: 'name', type: 'string', description: 'App name', default: 'MyApp' },
      {
        name: 'sections',
        type: 'array',
        description: 'Settings sections',
        default: ['Profile', 'Notifications', 'Security'],
      },
    ],
    files: [
      {
        path: 'app/settings/page.tsx',
        content: `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your {{name}} preferences</p>
      </div>
      <Separator />
      <Tabs defaultValue="{{lowerCase sections}}" className="space-y-4">
        <TabsList>
          {{#each sections}}
          <TabsTrigger value="{{lowerCase this}}">{{this}}</TabsTrigger>
          {{/each}}
        </TabsList>
        {{#each sections}}
        <TabsContent value="{{lowerCase this}}">
          <Card>
            <CardHeader>
              <CardTitle>{{this}}</CardTitle>
              <CardDescription>Manage your {{lowerCase this}} settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Setting 1</Label>
                <Input placeholder="Enter value..." />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable feature</Label>
                  <p className="text-sm text-muted-foreground">Toggle this feature on or off</p>
                </div>
                <Switch />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        {{/each}}
      </Tabs>
    </div>
  );
}
`,
      },
    ],
  },
];

/**
 * Find a template by name
 */
export function findTemplate(name: string): PlopTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.name === name);
}

/**
 * Find templates by category
 */
export function findTemplatesByCategory(category: PlopTemplate['category']): PlopTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Find templates suitable for a UI library
 */
export function findTemplatesForLibrary(libraryId: string): PlopTemplate[] {
  return BUILT_IN_TEMPLATES.filter((t) => !t.uiLibrary || t.uiLibrary === libraryId);
}

/**
 * Generate the prompt section that tells the AI about available templates
 */
export function generateTemplatePromptContext(selectedLibraryIds?: string[]): string {
  const available = selectedLibraryIds
    ? BUILT_IN_TEMPLATES.filter(
        (t) => !t.uiLibrary || selectedLibraryIds.includes(t.uiLibrary),
      )
    : BUILT_IN_TEMPLATES;

  if (available.length === 0) return '';

  const templateList = available
    .map((t) => {
      const vars = t.variables.map((v) => `${v.name}: ${v.type}`).join(', ');
      return `  - "${t.name}" (${t.category}): ${t.description} | Variables: ${vars}`;
    })
    .join('\n');

  return `
## Token-Saving Templates (PlopJS)
You have access to pre-built templates. Instead of generating all boilerplate code from scratch, use the \`useTemplate\` tool when the user's request matches a template. This saves significant tokens.

Available templates:
${templateList}

When using a template, call useTemplate with the template name and variable values. The template system will generate the files automatically. You can then customize the generated code with createOrUpdateFiles for any specific changes the user needs.

PREFER templates over writing from scratch when the request matches a template's purpose.
`;
}
