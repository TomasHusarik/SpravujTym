import {
    ActionIcon,
    Badge,
    Button,
    Card,
    createTheme,
    Modal,
    Paper,
    Popover,
    Tooltip,
    type MantineColorsTuple,
} from '@mantine/core';

// Club blue from the logo (#0f13ef), slightly softened for UI use
const brand: MantineColorsTuple = [
    '#ebeeff',
    '#d3d9fd',
    '#a5affa',
    '#7383f7',
    '#4a5ef4',
    '#3046f3',
    '#2139f3',
    '#132cd9',
    '#0a26c3',
    '#001fab',
];

// Club orange from the logo (#ea9927)
const accent: MantineColorsTuple = [
    '#fff4e2',
    '#ffe8cc',
    '#fed09b',
    '#fdb764',
    '#fca238',
    '#fb941b',
    '#ea8a0c',
    '#d07800',
    '#b96a00',
    '#a05b00',
];

export const theme = createTheme({
    primaryColor: 'brand',
    primaryShade: { light: 6, dark: 5 },
    colors: { brand, accent },
    // Picks black/white text automatically, e.g. on orange buttons
    autoContrast: true,
    defaultRadius: 'md',
    cursorType: 'pointer',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    headings: {
        fontWeight: '700',
        sizes: {
            h1: { fontSize: '1.75rem', lineHeight: '1.25' },
            h2: { fontSize: '1.5rem', lineHeight: '1.3' },
            h3: { fontSize: '1.25rem', lineHeight: '1.35' },
        },
    },
    components: {
        Button: Button.extend({ defaultProps: { radius: 'md' } }),
        ActionIcon: ActionIcon.extend({ defaultProps: { radius: 'xl' } }),
        Paper: Paper.extend({ defaultProps: { radius: 'lg' } }),
        Card: Card.extend({ defaultProps: { radius: 'lg', withBorder: true, padding: 'md' } }),
        Badge: Badge.extend({ defaultProps: { radius: 'sm' } }),
        Modal: Modal.extend({ defaultProps: { radius: 'lg', centered: true } }),
        Popover: Popover.extend({ defaultProps: { radius: 'md' } }),
        Tooltip: Tooltip.extend({ defaultProps: { withArrow: true } }),
    },
});
