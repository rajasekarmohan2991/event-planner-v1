import * as React from 'react';

// Button Component
declare module '@/components/ui/button' {
  import * as React from 'react';
  
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
    isLoading?: boolean;
  }

  const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
  
  export { Button };
  export default Button;
}

// Card Component
declare module '@/components/ui/card' {
  import * as React from 'react';
  
  interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
  interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
  interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
  interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

  export const Card: React.FC<CardProps>;
  export const CardHeader: React.FC<CardHeaderProps>;
  export const CardTitle: React.FC<CardTitleProps>;
  export const CardDescription: React.FC<CardDescriptionProps>;
  export const CardContent: React.FC<CardContentProps>;
  export const CardFooter: React.FC<CardFooterProps>;
}

// Input Component
declare module '@/components/ui/input' {
  import * as React from 'react';
  
  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

  const Input: React.ForwardRefExoticComponent<
    InputProps & React.RefAttributes<HTMLInputElement>
  >;
  
  export { Input };
  export default Input;
}

// Table Components
declare module '@/components/ui/table' {
  import * as React from 'react';
  
  interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}
  interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
  interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
  interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}
  interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}
  interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}
  interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}
  interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {}

  export const Table: React.FC<TableProps>;
  export const TableHeader: React.FC<TableHeaderProps>;
  export const TableBody: React.FC<TableBodyProps>;
  export const TableFooter: React.FC<TableFooterProps>;
  export const TableRow: React.FC<TableRowProps>;
  export const TableHead: React.FC<TableHeadProps>;
  export const TableCell: React.FC<TableCellProps>;
  export const TableCaption: React.FC<TableCaptionProps>;
}

// Avatar Components
declare module '@/components/ui/avatar' {
  import * as React from 'react';
  
  interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
    className?: string;
  }
  
  interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    className?: string;
  }
  
  interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {
    className?: string;
    delayMs?: number;
  }

  export const Avatar: React.FC<AvatarProps>;
  export const AvatarImage: React.FC<AvatarImageProps>;
  export const AvatarFallback: React.FC<AvatarFallbackProps>;
}

// Dropdown Menu Components
declare module '@/components/ui/dropdown-menu' {
  import * as React from 'react';
  import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
  
  interface DropdownMenuProps extends DropdownMenuPrimitive.DropdownMenuProps {}
  interface DropdownMenuTriggerProps extends DropdownMenuPrimitive.DropdownMenuTriggerProps {}
  interface DropdownMenuContentProps extends DropdownMenuPrimitive.DropdownMenuContentProps {}
  interface DropdownMenuItemProps extends DropdownMenuPrimitive.DropdownMenuItemProps {}
  interface DropdownMenuLabelProps extends DropdownMenuPrimitive.DropdownMenuLabelProps {}
  interface DropdownMenuSeparatorProps extends DropdownMenuPrimitive.DropdownMenuSeparatorProps {}
  interface DropdownMenuGroupProps extends DropdownMenuPrimitive.DropdownMenuGroupProps {}
  interface DropdownMenuRadioGroupProps extends DropdownMenuPrimitive.DropdownMenuRadioGroupProps {}
  interface DropdownMenuRadioItemProps extends DropdownMenuPrimitive.DropdownMenuRadioItemProps {}
  interface DropdownMenuCheckboxItemProps extends DropdownMenuPrimitive.DropdownMenuCheckboxItemProps {}
  interface DropdownMenuSubProps extends DropdownMenuPrimitive.DropdownMenuSubProps {}
  interface DropdownMenuSubTriggerProps extends DropdownMenuPrimitive.DropdownMenuSubTriggerProps {}
  interface DropdownMenuSubContentProps extends DropdownMenuPrimitive.DropdownMenuSubContentProps {}

  export const DropdownMenu: React.FC<DropdownMenuProps> & {
    Trigger: React.FC<DropdownMenuTriggerProps>;
    Content: React.FC<DropdownMenuContentProps>;
    Item: React.FC<DropdownMenuItemProps>;
    Label: React.FC<DropdownMenuLabelProps>;
    Separator: React.FC<DropdownMenuSeparatorProps>;
    Group: React.FC<DropdownMenuGroupProps>;
    RadioGroup: React.FC<DropdownMenuRadioGroupProps>;
    RadioItem: React.FC<DropdownMenuRadioItemProps>;
    CheckboxItem: React.FC<DropdownMenuCheckboxItemProps>;
    Sub: React.FC<DropdownMenuSubProps>;
    SubTrigger: React.FC<DropdownMenuSubTriggerProps>;
    SubContent: React.FC<DropdownMenuSubContentProps>;
  };
}

// Toast Components
declare module '@/components/ui/toast' {
  import * as React from 'react';
  
  interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    duration?: number;
  }

  interface ToastActionElement extends React.ReactElement {
    type: typeof Action;
  }

  export const Toast: React.FC<ToastProps> & {
    Action: typeof Action;
    Close: typeof Close;
    Description: typeof Description;
    Provider: typeof Provider;
    Title: typeof Title;
    Viewport: typeof Viewport;
  };
}

declare module '@/components/ui/use-toast' {
  interface Toast {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
    action?: React.ReactNode;
  }

  interface ToastReturnType {
    toast: (props: Toast) => {
      id: string;
      dismiss: () => void;
      update: (props: Toast) => void;
    };
    dismiss: (toastId?: string) => void;
    toasts: Toast[];
  }

  export function useToast(): ToastReturnType;
}

// Badge Component
declare module '@/components/ui/badge' {
  import * as React from 'react';
  
  interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  }

  export const Badge: React.FC<BadgeProps>;
}

// Label Component
declare module '@/components/ui/label' {
  import * as React from 'react';
  
  interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

  const Label: React.ForwardRefExoticComponent<
    LabelProps & React.RefAttributes<HTMLLabelElement>
  >;
  
  export { Label };
  export default Label;
}
