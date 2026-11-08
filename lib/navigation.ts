import type { IconType } from "react-icons";
import {
  BiSolidDashboard,
  BiNews,
  BiTransfer,
} from "react-icons/bi";
import {
  MdOutlineGroups,
  MdOutlineCalendarMonth,
  MdOutlineSettings,
  MdOutlinePersonSearch,
  MdOutlineSportsBasketball,
} from "react-icons/md";
import {
  HiOutlineDocumentText,
  HiOutlineSwitchHorizontal,
  HiOutlineTicket,
  HiOutlineCalculator,
  HiOutlineUserGroup,
  HiOutlineHome,
} from "react-icons/hi";
import {
  TbTrophy,
  TbShieldCog,
  TbFileImport,
  TbCake,
  TbChecklist,
} from "react-icons/tb";
import {
  FiUser,
  FiHelpCircle,
  FiShield,
  FiFileText,
  FiInfo,
} from "react-icons/fi";
import { RiExchangeFundsLine } from "react-icons/ri";
import { LuBuilding2, LuUsers } from "react-icons/lu";

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
  // An item with children opens as a dropdown in the sidebar instead of
  // navigating on its own.
  children?: NavItem[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

// The Settings screen's own tabs, shown as a dropdown under Settings. Real
// sub-routes rather than query params, so the sidebar can tell which one is
// open from the pathname alone.
export const settingsChildren: NavItem[] = [
  { label: "Profile", href: "/settings/profile", icon: FiUser },
  { label: "Help & Support", href: "/settings/help", icon: FiHelpCircle },
  { label: "Privacy Policy", href: "/settings/privacy", icon: FiShield },
  { label: "Term & Conditions", href: "/settings/terms", icon: FiFileText },
  { label: "About Us", href: "/settings/about", icon: FiInfo },
];

export const dashboardNav: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Avora Home", href: "/home", icon: HiOutlineHome },
      { label: "Dashboard", href: "/dashboard", icon: BiSolidDashboard },
    ],
  },
  {
    title: "LEAGUE",
    items: [
      { label: "Standings", href: "/league/standings", icon: TbTrophy },
      { label: "Teams", href: "/league/teams", icon: MdOutlineGroups },
      {
        label: "Schedule",
        href: "/league/schedule",
        icon: MdOutlineCalendarMonth,
      },
      { label: "League News", href: "/league/news", icon: BiNews },
      {
        label: "Transactions",
        href: "/league/transactions",
        icon: BiTransfer,
      },
      {
        label: "Trade Finder",
        href: "/league/trade-finder",
        icon: RiExchangeFundsLine,
      },
      {
        label: "Free Agency",
        href: "/league/free-agency",
        icon: MdOutlinePersonSearch,
      },
      {
        label: "Draft",
        href: "/league/draft",
        icon: MdOutlineSportsBasketball,
      },
    ],
  },
  {
    title: "MY TEAM",
    items: [
      { label: "My Team", href: "/my-team", icon: HiOutlineUserGroup },
      {
        label: "Contracts",
        href: "/my-team/contracts",
        icon: HiOutlineDocumentText,
      },
      {
        label: "Trade Center",
        href: "/my-team/trade-center",
        icon: HiOutlineSwitchHorizontal,
      },
      {
        label: "Draft Pick",
        href: "/my-team/draft-picks",
        icon: HiOutlineTicket,
      },
      {
        label: "Payroll Simulator",
        href: "/my-team/payroll-simulator",
        icon: HiOutlineCalculator,
      },
    ],
  },
  {
    title: "TOOLS",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: MdOutlineSettings,
        children: settingsChildren,
      },
    ],
  },
];

export const commissionerNav: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "League Office", href: "/league-office", icon: TbShieldCog },
      {
        label: "Action Center",
        href: "/league-office/action-center",
        icon: TbChecklist,
      },
    ],
  },
  {
    title: "LEAGUE SETTINGS",
    items: [
      { label: "League Settings", href: "/league-office/settings", icon: MdOutlineSettings },
      { label: "Salary Cap Settings", href: "/league-office/salary-cap", icon: HiOutlineCalculator },
      { label: "Roster Rules", href: "/league-office/roster-rules", icon: HiOutlineDocumentText },
      { label: "League Calendar", href: "/league-office/calendar", icon: MdOutlineCalendarMonth },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "User Assignment", href: "/league-office/users", icon: LuUsers },
      { label: "Team Management", href: "/league-office/teams", icon: MdOutlineGroups },
      { label: "Roster Management", href: "/league-office/rosters", icon: HiOutlineUserGroup },
      { label: "Salary Management", href: "/league-office/salaries", icon: RiExchangeFundsLine },
      { label: "Player Import", href: "/league-office/player-import", icon: TbFileImport },
      { label: "Free Agency Management", href: "/league-office/free-agency", icon: MdOutlinePersonSearch },
    ],
  },
  {
    title: "DRAFT",
    items: [
      { label: "Draft Picks", href: "/league-office/draft-picks", icon: HiOutlineTicket },
      { label: "Startup Draft", href: "/league-office/startup-draft", icon: MdOutlineSportsBasketball },
      { label: "Rookie Draft", href: "/league-office/rookie-draft", icon: TbTrophy },
    ],
  },
  {
    title: "TOOLS",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: MdOutlineSettings,
        children: settingsChildren,
      },
    ],
  },
];

export const adminNav: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/platform", icon: BiSolidDashboard },
    ],
  },
  {
    title: "PLATFORM MANAGEMENT",
    items: [
      { label: "Leagues", href: "/platform/leagues", icon: LuBuilding2 },
      { label: "Users", href: "/platform/users", icon: LuUsers },
      { label: "Player Birthdates", href: "/platform/birthdates", icon: TbCake },
    ],
  },
  {
    title: "TOOLS",
    items: [{ label: "Settings", href: "/platform/settings", icon: MdOutlineSettings }],
  },
];

export function navForRole(role: string): NavSection[] {
  if (role === "commissioner") return commissionerNav;
  if (role === "admin") return adminNav;
  return dashboardNav;
}

export const pageSubtitles: Record<string, string> = {
  "/league-office":
    "Manage your league's rules, rosters, and day-to-day operations.",
  "/league-office/action-center":
    "Review pending trades and league compliance alerts.",
  "/league-office/salary-cap":
    "Set the league-wide salary cap and all derived thresholds.",
  "/league-office/roster-rules":
    "Define roster size limits and position slot configuration.",
  "/league-office/users": "Assign league members to their franchise teams.",
  "/league-office/teams": "Manage franchises, team details, and roster health.",
  "/league-office/rosters": "View and manage player rosters for each team.",
  "/league-office/salaries":
    "Review contracts by team and manage Traded Player Exceptions.",
  "/league-office/player-import":
    "Import player rosters and salaries via CSV upload.",
  "/league-office/free-agency":
    "Oversee free agency offers across the league — default view shows all offers and all teams.",
  "/league-office/draft-picks":
    "League-wide draft asset inventory. Reassign picks between teams.",
  "/league-office/startup-draft":
    "Configure draft format, pick times, and team order for the league startup draft.",
  "/league-office/rookie-draft":
    "Configure your rookie draft format, pick times, and team order for the league rookie draft.",
  "/league-office/calendar":
    "Key dates and events for this season.",
  "/league-office/settings":
    "Configure league identity, setup, visibility, and trading rules.",
  "/platform": "Here's what's happening across AVORA.",
  "/platform/users": "Here's what's happening across AVORA.",
  "/platform/leagues": "Here's what's happening across AVORA.",
  "/platform/birthdates":
    "Load player birthdates from a CSV. The NBA data feed does not carry them.",
  "/platform/settings": "Manage your admin profile and system configurations.",
  "/settings": "Manage your profile and your league's information pages.",
  "/settings/profile": "Your account details and password.",
  "/settings/help": "Help and support for this league.",
  "/settings/privacy": "The privacy policy for this league.",
  "/settings/terms": "The terms and conditions for this league.",
  "/settings/about": "About this league.",
};

export const pageTitles: Record<string, string> = {
  "/league-office": "League Office",
  "/league-office/action-center": "Commissioner Action Center",
  "/league-office/salary-cap": "Salary Cap Settings",
  "/league-office/roster-rules": "Roster Rules",
  "/league-office/users": "User Assignment",
  "/league-office/teams": "Team Management",
  "/league-office/rosters": "Roster Management",
  "/league-office/salaries": "Salary Management",
  "/league-office/player-import": "Player Import",
  "/league-office/free-agency": "Free Agency Management",
  "/league-office/draft-picks": "Draft Picks",
  "/league-office/startup-draft": "Startup Draft Settings",
  "/league-office/rookie-draft": "Rookie Draft Settings",
  "/league-office/calendar": "League Calendar",
  "/league-office/settings": "League Settings",
  "/platform": "Platform Overview",
  "/platform/users": "Users",
  "/platform/leagues": "Leagues",
  "/platform/birthdates": "Player Birthdates",
  "/platform/settings": "Settings",
  "/dashboard": "Dashboard",
  "/league/standings": "Standings",
  "/league/teams": "Teams",
  "/league/schedule": "Schedule",
  "/league/news": "League News",
  "/league/transactions": "Transactions",
  "/league/trade-finder": "Trade Finder",
  "/league/free-agency": "Free Agency",
  "/league/draft": "Draft",
  "/league/draft/rookie": "Rookie Draft",
  "/league/draft/startup": "Startup Draft",
  "/my-team": "My Team",
  "/my-team/contracts": "Contracts",
  "/my-team/trade-center": "Trade Center",
  "/my-team/draft-picks": "Draft Pick",
  "/my-team/payroll-simulator": "Payroll Simulator",
  "/settings": "Settings",
  "/settings/profile": "Profile",
  "/settings/help": "Help & Support",
  "/settings/privacy": "Privacy Policy",
  "/settings/terms": "Term & Conditions",
  "/settings/about": "About Us",
};
