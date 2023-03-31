import { terser } from 'rollup-plugin-terser'
import copy from 'rollup-plugin-copy';
import multi from '@rollup/plugin-multi-entry'
import scss from 'rollup-plugin-scss';

export default [
    {
        input: {
            include: [
                'css/*.*',
                'scripts/*.js',
                'scripts/**/*.js',
            ],
            exclude: [
                'dist/*',
            ],
        },
        output: {
            format: 'esm',
            file: 'dist/token-action-hud-pf1.min.js'
        },
        plugins: [
            copy({
                targets: [
                    { src: 'module.json', dest: 'dist/' },
                    { src: 'languages/en.json', dest: 'dist/languages/' },
                    { src: 'readme.md', dest: 'dist/' },
                ]
            }),
            scss({
                output: "dist/token-action-hud-pf1.css",
                failOnError: true,
            }),
            // terser({ keep_classnames: true, keep_fnames: true }),
            multi(),
        ],
    }
]
