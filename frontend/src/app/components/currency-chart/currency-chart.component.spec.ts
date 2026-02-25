import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrencyChartComponent } from './currency-chart.component';
import { AggregatedRate } from '../../models/currency.model';

describe('CurrencyChartComponent', () => {
  let component: CurrencyChartComponent;
  let fixture: ComponentFixture<CurrencyChartComponent>;

  const mockAggregatedRates: AggregatedRate[] = [
    {
      period: '2024-01',
      currency_code: 'USD',
      avg_rate: 4.0215,
      min_rate: 3.9800,
      max_rate: 4.0500,
      count: 22
    },
    {
      period: '2024-02',
      currency_code: 'USD',
      avg_rate: 4.0350,
      min_rate: 3.9900,
      max_rate: 4.0800,
      count: 20
    },
    {
      period: '2024-03',
      currency_code: 'USD',
      avg_rate: 3.9800,
      min_rate: 3.9200,
      max_rate: 4.0100,
      count: 21
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CurrencyChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyChartComponent);
    component = fixture.componentInstance;
  });

  it('powinien się utworzyć', () => {
    expect(component).toBeTruthy();
  });

  // ============ hasData ============

  describe('hasData', () => {
    it('powinien zwrócić false bez danych', () => {
      component.aggregatedRates = [];
      expect(component.hasData()).toBeFalse();
    });

    it('powinien zwrócić true z danymi', () => {
      component.aggregatedRates = mockAggregatedRates;
      expect(component.hasData()).toBeTrue();
    });
  });

  // ============ getStats ============

  describe('getStats', () => {
    it('powinien zwrócić null bez danych', () => {
      component.aggregatedRates = [];
      expect(component.getStats()).toBeNull();
    });

    it('powinien obliczyć poprawne statystyki', () => {
      component.aggregatedRates = mockAggregatedRates;
      const stats = component.getStats();

      expect(stats).toBeTruthy();
      expect(stats!.min).toBe(3.9200);
      expect(stats!.max).toBe(4.0800);
      expect(stats!.count).toBe(63); // 22 + 20 + 21
      expect(stats!.avg).toBeCloseTo(4.0122, 3);
    });

    it('powinien obliczyć statystyki dla jednego okresu', () => {
      component.aggregatedRates = [mockAggregatedRates[0]];
      const stats = component.getStats();

      expect(stats).toBeTruthy();
      expect(stats!.min).toBe(3.9800);
      expect(stats!.max).toBe(4.0500);
      expect(stats!.count).toBe(22);
      expect(stats!.avg).toBe(4.0215);
    });
  });

  // ============ Cykl życia ============

  describe('cykl życia', () => {
    it('powinien zniszczyć wykres przy destroy', () => {
      component.aggregatedRates = mockAggregatedRates;
      fixture.detectChanges();

      spyOn(component, 'destroyChart');
      component.ngOnDestroy();

      expect(component.destroyChart).toHaveBeenCalled();
    });

    it('powinien odtworzyć wykres przy zmianie danych', () => {
      component.aggregatedRates = mockAggregatedRates;
      fixture.detectChanges();

      spyOn(component, 'createChart');

      component.aggregatedRates = [
        {
          period: '2024-04',
          currency_code: 'USD',
          avg_rate: 4.10,
          min_rate: 4.05,
          max_rate: 4.15,
          count: 20
        }
      ];

      component.ngOnChanges({
        aggregatedRates: {
          currentValue: component.aggregatedRates,
          previousValue: mockAggregatedRates,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.createChart).toHaveBeenCalled();
    });
  });

  // ============ Renderowanie ============

  describe('renderowanie', () => {
    it('powinien wyświetlić komunikat o braku danych', () => {
      component.aggregatedRates = [];
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('Brak danych');
    });

    it('powinien wyświetlić canvas gdy są dane', () => {
      component.aggregatedRates = mockAggregatedRates;
      fixture.detectChanges();

      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('powinien wyświetlić statystyki gdy są dane', () => {
      component.aggregatedRates = mockAggregatedRates;
      fixture.detectChanges();

      const stats = fixture.nativeElement.querySelectorAll('.stat-item');
      expect(stats.length).toBe(5);
    });

    it('nie powinien wyświetlić statystyk bez danych', () => {
      component.aggregatedRates = [];
      fixture.detectChanges();

      const stats = fixture.nativeElement.querySelectorAll('.stat-item');
      expect(stats.length).toBe(0);
    });

    it('powinien wyświetlić poprawne etykiety statystyk', () => {
      component.aggregatedRates = mockAggregatedRates;
      fixture.detectChanges();

      const labels = fixture.nativeElement.querySelectorAll('.stat-label');
      const labelTexts = Array.from(labels).map((l: any) => l.textContent.trim());

      expect(labelTexts).toContain('Średnia');
      expect(labelTexts).toContain('Minimum');
      expect(labelTexts).toContain('Maksimum');
      expect(labelTexts).toContain('Rozpiętość');
      expect(labelTexts).toContain('Notowań');
    });
  });

  // ============ destroyChart ============

  describe('destroyChart', () => {
    it('powinien bezpiecznie obsłużyć brak wykresu', () => {
      expect(() => component.destroyChart()).not.toThrow();
    });
  });
});
