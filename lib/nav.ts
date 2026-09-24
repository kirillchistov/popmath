export function isCurrentPath(currentPath: string, href: string) {
  if (href === '/') return currentPath === '/';
  if (href === '/task') {
    return currentPath === '/task' || currentPath.startsWith('/topic/');
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}
