"use client";

import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/NotificationsNoneOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import HelpIcon from "@mui/icons-material/HelpOutline";
import { signOut, useSession } from "next-auth/react";
import { ColorModeToggle } from "@/components/common/ColorModeToggle";
import { Logo } from "@/components/common/Logo";
import { initials } from "@/lib/format";
import { NOTIFICATIONS } from "@/lib/mockData";
import Link from "next/link";
import { SIDEBAR_WIDTH } from "./Sidebar";

type Props = {
  onMobileMenuClick: () => void;
};

export function AppTopBar({ onMobileMenuClick }: Props) {
  const [profileEl, setProfileEl] = useState<null | HTMLElement>(null);
  const [notifEl, setNotifEl] = useState<null | HTMLElement>(null);
  const { data: session } = useSession();
  const u = (session?.user ?? {}) as { name?: string | null; email?: string | null; firstName?: string; lastName?: string };
  const displayName =
    (u.firstName || u.lastName)
      ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
      : (u.name ?? u.email ?? "Aptiverse");
  const subtitle = u.email ?? "";

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <AppBar position="sticky">
      <Toolbar
        disableGutters
        sx={{ minHeight: { xs: 64, md: 68 }, pr: { xs: 2, md: 3 }, gap: 1.5 }}
      >
        <IconButton
          color="inherit"
          onClick={onMobileMenuClick}
          sx={{ ml: 2, display: { md: "none" } }}
          aria-label="Open menu"
        >
          <MenuIcon />
        </IconButton>

        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            width: { md: SIDEBAR_WIDTH },
            height: "100%",
            pl: { xs: 0, md: 3 },
            pr: { xs: 0, md: 2 },
            borderRight: { md: 1 },
            borderColor: "divider",
            flexShrink: 0,
            color: "text.primary",
            textDecoration: "none",
          }}
        >
          <Logo size={30} />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "action.hover",
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            width: { xs: 0, sm: 320, md: 380 },
            opacity: { xs: 0, sm: 1 },
            transition: "opacity 200ms",
          }}
        >
          <SearchIcon fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />
          <InputBase
            placeholder="Search subjects, SBAs, tutors…"
            sx={{ flex: 1, fontSize: "0.875rem" }}
          />
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              px: 0.75,
              py: 0.25,
              fontSize: "0.7rem",
              color: "text.secondary",
            }}
          >
            ⌘K
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={0.75} alignItems="center">
          <ColorModeToggle />

          <Tooltip title="Notifications">
            <IconButton onClick={(e) => setNotifEl(e.currentTarget)} color="inherit">
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            open={!!notifEl}
            anchorEl={notifEl}
            onClose={() => setNotifEl(null)}
            slotProps={{ paper: { sx: { width: 380, maxHeight: 480 } } }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </Box>
            {NOTIFICATIONS.slice(0, 5).map((n) => (
              <MenuItem key={n.id} sx={{ alignItems: "flex-start", py: 1.5, whiteSpace: "normal" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {n.body}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem component={Link} href="/dashboard/notifications" onClick={() => setNotifEl(null)}>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                View all
              </Typography>
            </MenuItem>
          </Menu>

          <IconButton onClick={(e) => setProfileEl(e.currentTarget)} sx={{ ml: 0.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.85rem", fontWeight: 700 }}>
              {initials(displayName)}
            </Avatar>
          </IconButton>

          <Menu open={!!profileEl} anchorEl={profileEl} onClose={() => setProfileEl(null)}>
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {displayName}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Divider />
            <MenuItem component={Link} href="/dashboard/settings" onClick={() => setProfileEl(null)}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <MenuItem component={Link} href="/dashboard/help" onClick={() => setProfileEl(null)}>
              <ListItemIcon>
                <HelpIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Help & feedback" />
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setProfileEl(null);
                signOut({ callbackUrl: "/login" });
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Sign out" />
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
