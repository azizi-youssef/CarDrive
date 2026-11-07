// @vitest-environment jsdom
import '@/tests/setup/dom';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrandMarquee, FEATURED_MOTORCYCLE_BRANDS } from './BrandMarquee';
import { BRAND_LOGO_PATHS } from '@/lib/constants/brand-logos';

describe('BrandMarquee — marques de motos', () => {
  it('section titrée, lien vers le catalogue motos', () => {
    render(<BrandMarquee kind="motorcycles" vehicleCounts={{}} />);
    const section = screen.getByRole('region', { name: 'Les marques de motos' });
    expect(within(section).getByRole('link', { name: /Toutes les motos/ })).toHaveAttribute('href', '/motos');
    expect(screen.getByRole('region', { name: 'Marques de motos disponibles, défilement horizontal' })).toBeInTheDocument();
  });

  it('chaque marque mène au catalogue motos filtré, avec le nombre réel de motos', () => {
    render(<BrandMarquee kind="motorcycles" vehicleCounts={{ yamaha: 1, suzuki: 2 }} />);
    expect(screen.getByRole('link', { name: 'Voir les motos Yamaha — 1 moto' })).toHaveAttribute('href', '/motos?brand=Yamaha');
    expect(screen.getByRole('link', { name: 'Voir les motos Suzuki — 2 motos' })).toHaveAttribute('href', '/motos?brand=Suzuki');
    // Marque sans moto au catalogue : annoncée comme bientôt disponible, jamais un nombre inventé
    expect(screen.getByRole('link', { name: 'Voir les motos Ducati — Bientôt disponible' })).toBeInTheDocument();
  });

  it('chaque marque a un logo (tracé libre de droits) ou un badge typographique', () => {
    const { container } = render(<BrandMarquee kind="motorcycles" vehicleCounts={{}} />);
    const cards = container.querySelectorAll('ul > li');
    expect(cards).toHaveLength(FEATURED_MOTORCYCLE_BRANDS.length);
    for (const card of cards) expect(card.querySelector('svg')).not.toBeNull();
    const withoutPath = FEATURED_MOTORCYCLE_BRANDS.filter((brand) => !BRAND_LOGO_PATHS[brand]);
    expect(withoutPath).toEqual(['SYM', 'Kawasaki']);
    expect(container.querySelector('svg text')?.textContent).toBe('SYM');
  });

  it('sur la page /motos : un clic applique le filtre sur place, le lien reste un vrai lien', async () => {
    const onBrandSelect = vi.fn();
    render(<BrandMarquee kind="motorcycles" vehicleCounts={{ yamaha: 1 }} onBrandSelect={onBrandSelect} />);
    const yamaha = screen.getByRole('link', { name: 'Voir les motos Yamaha — 1 moto' });
    expect(yamaha).toHaveAttribute('href', '/motos?brand=Yamaha');

    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    yamaha.dispatchEvent(click);
    expect(onBrandSelect).toHaveBeenCalledWith('Yamaha');
    expect(click.defaultPrevented).toBe(true);

    // Ctrl/Cmd + clic : ouverture dans un nouvel onglet, sans filtrer la page courante
    const newTab = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
    yamaha.dispatchEvent(newTab);
    expect(onBrandSelect).toHaveBeenCalledTimes(1);
  });

  it('les deux carrousels coexistent sur une page sans identifiant en double', () => {
    const { container } = render(
      <>
        <BrandMarquee kind="cars" vehicleCounts={{}} />
        <BrandMarquee kind="motorcycles" reverse vehicleCounts={{}} />
      </>
    );
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(screen.getByRole('region', { name: 'Les grandes marques' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir les véhicules Dacia — Bientôt disponible' })).toHaveAttribute(
      'href',
      '/search?brand=Dacia'
    );
  });
});
