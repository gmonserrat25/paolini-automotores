/* Publica dist/ en la rama gh-pages.

   No usamos un workflow de Actions porque el token de `gh` de esta máquina no
   tiene el scope `workflow` y GitHub rechaza el push de .github/workflows/.
   Esto hace lo mismo desde acá: construye con la base del subdirectorio y
   empuja el resultado como una rama huérfana. */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'inherit' })

run('npm', ['run', 'build:pages'], root)

const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
  cwd: root,
  encoding: 'utf8',
}).trim()

const staging = mkdtempSync(join(tmpdir(), 'paolini-pages-'))
try {
  cpSync(join(root, 'dist'), staging, { recursive: true })
  // Sin esto, Pages corre Jekyll y se saltea los directorios que empiezan con _
  writeFileSync(join(staging, '.nojekyll'), '')

  run('git', ['init', '-q', '-b', 'gh-pages'], staging)
  run('git', ['add', '-A'], staging)
  run('git', ['-c', 'user.name=deploy', '-c', 'user.email=deploy@local',
              'commit', '-q', '-m', 'Publicar sitio'], staging)
  run('git', ['push', '-f', remote, 'gh-pages'], staging)
  console.log('\nPublicado en gh-pages.')
} finally {
  rmSync(staging, { recursive: true, force: true })
}
