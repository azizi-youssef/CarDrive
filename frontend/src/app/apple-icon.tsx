import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

/** Icône d'écran d'accueil iOS : PNG 180×180 généré à partir de l'icône du site (app/icon.png). */
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const icon = await readFile(path.join(process.cwd(), 'src', 'app', 'icon.png')).catch(() =>
    readFile(path.join(process.cwd(), 'frontend', 'src', 'app', 'icon.png'))
  );
  const src = `data:image/png;base64,${icon.toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={148} height={148} alt="" />
      </div>
    ),
    size
  );
}
