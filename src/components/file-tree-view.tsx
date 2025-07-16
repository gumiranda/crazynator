import type { TreeItem } from '@/types/files';
import { ChevronRightIcon, FileIcon, FolderIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarRail,
} from '@/components/ui/sidebar';

type FileTreeViewProps = {
  data: TreeItem[];
  value?: string | null;
  onSelect?: (value: string) => void;
};

export default function FileTreeView({ data, value, onSelect }: FileTreeViewProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-full">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.map((item, index) => (
                  <TreeViewItem
                    key={index}
                    data={item}
                    selectedValue={value}
                    parentPath=""
                    onSelect={onSelect}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  );
}

type TreeViewItemProps = {
  data: TreeItem;
  selectedValue?: string | null;
  onSelect?: (value: string) => void;
  parentPath: string;
};

const TreeViewItem = ({ data, selectedValue, onSelect, parentPath }: TreeViewItemProps) => {
  // [["src", "Button.tsx"], "README.md"]
  const [name, ...items] = Array.isArray(data) ? data : [data];
  const currentPath = parentPath ? `${parentPath}/${name}` : name;

  // File
  if (!items.length) {
    const isSelected = selectedValue === currentPath;
    return (
      <SidebarMenuButton
        isActive={isSelected}
        className="data-[active=true]:bg-transparent"
        onClick={() => onSelect?.(currentPath)}
      >
        <FileIcon />
        <span className="truncate">{name}</span>
      </SidebarMenuButton>
    );
  }

  // Folder
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRightIcon className="transition-transform duration-200" />
            <FolderIcon />
            <span className="truncate">{name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((item, index) => (
              <TreeViewItem
                key={index}
                data={item}
                selectedValue={selectedValue}
                parentPath={currentPath}
                onSelect={onSelect}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
