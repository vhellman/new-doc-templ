import { createRootRoute, createRoute, createRouter, Link, Outlet, redirect } from '@tanstack/react-router'
import { Box, Typography } from '@mui/material'
import { AppHeader } from './components/AppHeader'
import { LayoutsPage } from './pages/LayoutsPage'
import { TextsPage } from './pages/TextsPage'

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: () => (
    <>
      <AppHeader />
      <Box component="main" sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>Page not found</Typography>
        <Link to="/texts">Go to Texts</Link>
      </Box>
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/texts', replace: true }) },
})

const textsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/texts',
  component: TextsPage,
})

const layoutsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/layouts',
  component: LayoutsPage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, textsRoute, layoutsRoute]),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
