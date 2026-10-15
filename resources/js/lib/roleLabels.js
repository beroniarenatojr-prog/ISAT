// The spatie role keys stay as-is in the database; this is only the wording
// shown in the UI.
//   super-admin -> Principal (or a division position_title, e.g. "Administrator",
//                  for a dual-role super-admin + teacher account)
//   admin       -> Master Teacher
//   teacher     -> Teacher
export const ROLE_LABELS = {
    'super-admin': 'Principal',
    admin: 'Master Teacher',
    teacher: 'Teacher',
};

/** Pull position_title out of a user's `division` (JSON string or object). */
function positionTitle(user) {
    if (!user) return null;
    let d = user.division ?? user;
    if (typeof d === 'string') {
        try { d = JSON.parse(d); } catch { return user.position_title ?? null; }
    }
    return d?.position_title ?? null;
}

/**
 * Normalise the many shapes a role prop arrives in (array of names, array of
 * {name}, or the shared `auth.roles`) down to a list of role-key strings.
 */
export function roleNames(input) {
    if (!input) return [];
    const list = Array.isArray(input) ? input : [input];
    return list
        .map((r) => (typeof r === 'string' ? r : r?.name))
        .filter(Boolean);
}

/**
 * Best single human label for a set of roles. Pass `user` (with a `division`)
 * so a dual-role super-admin + teacher account resolves to its position_title
 * (e.g. "Administrator") instead of "Principal" - mirrors User::roleLabel().
 */
export function roleLabel(input, user = null) {
    const names = roleNames(input);
    if (names.includes('super-admin')) {
        if (names.includes('teacher')) {
            const title = positionTitle(user);
            if (title && !title.includes('Principal')) return title;
        }
        return ROLE_LABELS['super-admin'];
    }
    if (names.includes('admin')) return ROLE_LABELS.admin;
    if (names.includes('teacher')) return ROLE_LABELS.teacher;
    return 'User';
}

export const hasRole = (input, role) => roleNames(input).includes(role);

export const isPrincipal = (input) => hasRole(input, 'super-admin');
export const isMasterTeacher = (input) => hasRole(input, 'admin') && !hasRole(input, 'super-admin');
/** Dual-role super-admin + teacher with a non-principal position_title. */
export const isAdministrator = (input, user = null) =>
    hasRole(input, 'super-admin') && hasRole(input, 'teacher') &&
    !!positionTitle(user) && !positionTitle(user).includes('Principal');
