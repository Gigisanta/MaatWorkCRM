"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart2,
  BarChart3,
  Bell,
  Book,
  Briefcase,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Command,
  Compass,
  Contact,
  Cpu,
  DollarSign,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Grid,
  Home,
  Info,
  Layout,
  List,
  Loader,
  LogOut,
  type LucideIcon,
  Menu,
  MoreVertical,
  PauseCircle,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Target,
  Users as Team,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  UserX,
  Users,
  WifiOff,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import React from "react";
import { cn } from "~/lib/utils";

export type IconName =
  | "Home"
  | "Users"
  | "BarChart3"
  | "BarChart2"
  | "Settings"
  | "LogOut"
  | "Menu"
  | "X"
  | "ChevronUp"
  | "ChevronDown"
  | "ChevronLeft"
  | "ChevronRight"
  | "User"
  | "Info"
  | "CheckCircle"
  | "AlertCircle"
  | "AlertTriangle"
  | "XCircle"
  | "WifiOff"
  | "Loader"
  | "chevron-up"
  | "chevron-down"
  | "x"
  | "info"
  | "check-circle"
  | "alert-circle"
  | "alert-triangle"
  | "x-circle"
  | "wifi-off"
  | "loader"
  | "refresh-cw"
  | "edit"
  | "more-vertical"
  | "trash-2"
  | "plus"
  | "check"
  | "search"
  | "list"
  | "grid"
  | "download"
  | "Book"
  | "ExternalLink"
  | "Contact"
  | "Team"
  | "GraduationCap"
  | "TrendingUp"
  | "Briefcase"
  | "Shield"
  | "UserPlus"
  | "FileText"
  | "Activity"
  | "RefreshCw"
  | "Clock"
  | "eye"
  | "eye-off"
  | "Eye"
  | "EyeOff"
  | "Navigation"
  | "Zap"
  | "command"
  | "Command"
  | "calendar"
  | "pause-circle"
  | "user-x"
  | "Layout"
  | "DollarSign"
  | "PieChart"
  | "Target"
  | "Bell"
  | "Cpu";

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className = "" }: IconProps) {
  const iconMap: Record<string, LucideIcon> = {
    Home,
    Users,
    BarChart3,
    BarChart2,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    User,
    Info,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    XCircle,
    WifiOff,
    Loader,
    "chevron-up": ChevronUp,
    "chevron-down": ChevronDown,
    x: X,
    info: Info,
    "check-circle": CheckCircle,
    "alert-circle": AlertCircle,
    "alert-triangle": AlertTriangle,
    "x-circle": XCircle,
    "wifi-off": WifiOff,
    loader: Loader,
    "refresh-cw": RefreshCw,
    edit: Edit,
    "more-vertical": MoreVertical,
    "trash-2": Trash2,
    plus: Plus,
    check: Check,
    search: Search,
    list: List,
    grid: Grid,
    download: Download,
    Book,
    ExternalLink,
    Contact,
    Team,
    GraduationCap,
    TrendingUp,
    Briefcase,
    Shield,
    UserPlus,
    FileText,
    Activity,
    RefreshCw,
    Clock,
    eye: Eye,
    "eye-off": EyeOff,
    Eye,
    EyeOff,
    Navigation: Compass,
    Zap,
    command: Command,
    Command,
    calendar: Calendar,
    "pause-circle": PauseCircle,
    "user-x": UserX,
    Layout,
    DollarSign,
    PieChart,
    Target,
    Bell,
    Cpu,
  };

  const IconComponent = iconMap[name] || AlertCircle;

  return <IconComponent size={size} className={cn("shrink-0", className)} suppressHydrationWarning />;
}
