import type { MembershipRole, UserRole } from "@prisma/client";

const DEFAULT_ROLE_BY_DOMAIN: Record<string, UserRole> = {
  "sjprep.org": "FACULTY",
  "sjprephawks.org": "STUDENT",
};

export function getDefaultRoleForEmail(email: string): UserRole | null {
  const domain = email.toLowerCase().split("@")[1];
  return domain ? (DEFAULT_ROLE_BY_DOMAIN[domain] ?? null) : null;
}

export function resolveRoleForUser(email: string, currentRole?: UserRole | null): UserRole | null {
  if (currentRole === "ADMIN") return currentRole;
  return getDefaultRoleForEmail(email);
}

export function canAccessAdmin(role?: UserRole | null) {
  return role === "ADMIN";
}

export function canAccessOversight(role?: UserRole | null) {
  return role === "ADMIN" || role === "FACULTY";
}

export function canAccessFacultyTools(role?: UserRole | null) {
  return role === "ADMIN" || role === "FACULTY";
}

export function canManageClubMembershipRole(role?: MembershipRole | null) {
  return role === "PRESIDENT" || role === "OFFICER" || role === "FACULTY_ADVISOR";
}

function getClubMembershipRank(role?: MembershipRole | null) {
  switch (role) {
    case "FACULTY_ADVISOR":
      return 3;
    case "PRESIDENT":
      return 2;
    case "OFFICER":
      return 1;
    case "MEMBER":
    default:
      return 0;
  }
}

export function canTransitionClubMemberRole(options: {
  isAdmin?: boolean;
  actorRole?: MembershipRole | null;
  targetCurrentRole?: MembershipRole | null;
  nextRole?: MembershipRole | null;
}) {
  if (options.isAdmin) return true;

  const actorRole = options.actorRole;
  const targetCurrentRole = options.targetCurrentRole ?? "MEMBER";
  const nextRole = options.nextRole ?? "MEMBER";

  if (!canManageClubMembershipRole(actorRole)) return false;
  if (nextRole === "FACULTY_ADVISOR" || nextRole === "PRESIDENT") return false;
  if (targetCurrentRole === "FACULTY_ADVISOR" || targetCurrentRole === "PRESIDENT") return false;

  const actorRank = getClubMembershipRank(actorRole);
  const targetRank = getClubMembershipRank(targetCurrentRole);
  const nextRank = getClubMembershipRank(nextRole);

  return actorRank > targetRank && actorRank > nextRank;
}

export function getClubLeadershipRoleLabel(role?: MembershipRole | null) {
  switch (role) {
    case "PRESIDENT":
      return "President";
    case "OFFICER":
      return "Student Leader";
    case "FACULTY_ADVISOR":
      return "Faculty Advisor";
    default:
      return "Member";
  }
}

export function getRoleLabel(role?: UserRole | null) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "FACULTY":
      return "Faculty";
    case "STUDENT_LEADER":
      return "Student Leader";
    case "STUDENT":
      return "Student";
    default:
      return "Member";
  }
}

export function getRoleBadgeClass(role?: UserRole | null) {
  switch (role) {
    case "ADMIN":
      return "bg-[rgba(139,26,26,.10)] text-[rgb(139,26,26)]";
    case "FACULTY":
      return "bg-[rgba(23,80,122,.10)] text-[rgb(23,80,122)] dark:bg-[rgba(116,196,255,.12)] dark:text-[rgb(161,220,255)]";
    case "STUDENT_LEADER":
      return "bg-[rgba(181,129,45,.12)] text-[rgb(138,92,19)] dark:bg-[rgba(218,173,74,.16)] dark:text-[rgb(241,208,127)]";
    default:
      return "bg-muted text-muted-foreground";
  }
}
