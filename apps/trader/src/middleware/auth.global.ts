import { useSession } from '~/composables/useSession';

export default defineNuxtRouteMiddleware((to) => {
  const session = useSession();

  if (to.path === '/login') {
    if (session.requireAuth.value && session.isAuthenticated.value) {
      const redirect =
        typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
          ? to.query.redirect
          : '/';
      return navigateTo(redirect);
    }

    return;
  }

  if (to.path === '/unauthorized') {
    return;
  }

  if (session.requireAuth.value && !session.isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }
});
