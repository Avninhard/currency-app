import {
  Component, Input, OnChanges, SimpleChanges,
  ViewChild, ElementRef, AfterViewInit, OnDestroy
} from '@angular/core';
import { AggregatedRate } from '../../models/currency.model';
import { Chart, registerables } from 'chart.js';

// Rejestracja komponentów Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-currency-chart',
  templateUrl: './currency-chart.component.html',
  styleUrls: ['./currency-chart.component.css']
})
export class CurrencyChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() aggregatedRates: AggregatedRate[] = [];
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.aggregatedRates.length > 0) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aggregatedRates'] && this.chartCanvas) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  /**
   * Tworzy lub odświeża wykres.
   */
  createChart(): void {
    if (!this.chartCanvas || this.aggregatedRates.length === 0) {
      return;
    }

    this.destroyChart();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.aggregatedRates.map(r => r.period);
    const avgData = this.aggregatedRates.map(r => r.avg_rate);
    const minData = this.aggregatedRates.map(r => r.min_rate);
    const maxData = this.aggregatedRates.map(r => r.max_rate);
    const currencyCode = this.aggregatedRates[0]?.currency_code || '';

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Średni kurs ${currencyCode}`,
            data: avgData,
            borderColor: '#4361ee',
            backgroundColor: 'rgba(67, 97, 238, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#4361ee'
          },
          {
            label: `Kurs minimalny`,
            data: minData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointBackgroundColor: '#10b981'
          },
          {
            label: `Kurs maksymalny`,
            data: maxData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            pointHoverRadius: 4,
            pointBackgroundColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: `Kurs ${currencyCode}/PLN`,
            font: { size: 16, weight: 'bold' },
            color: '#1e293b',
            padding: { bottom: 20 }
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
  label: (context: any) => {
    const value = Number(context.parsed.y);
    return `${context.dataset.label}: ${value.toFixed(4)} PLN`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Okres',
              font: { size: 12, weight: 'bold' },
              color: '#64748b'
            },
            ticks: {
              maxRotation: 45,
              font: { size: 11 },
              color: '#64748b'
            },
            grid: {
              display: false
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Kurs (PLN)',
              font: { size: 12, weight: 'bold' },
              color: '#64748b'
            },
            ticks: {
              font: { size: 11 },
              color: '#64748b',
              callback: (value) => {
                return Number(value).toFixed(4);
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    });
  }

  /**
   * Niszczy istniejący wykres.
   */
  destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  /**
   * Sprawdza czy są dane do wyświetlenia.
   */
  hasData(): boolean {
    return this.aggregatedRates.length > 0;
  }

  /**
   * Zwraca statystyki podsumowujące.
   */
  getStats(): { avg: number; min: number; max: number; count: number } | null {
    if (this.aggregatedRates.length === 0) return null;

    const allAvg = this.aggregatedRates.map(r => r.avg_rate);
    const allMin = this.aggregatedRates.map(r => r.min_rate);
    const allMax = this.aggregatedRates.map(r => r.max_rate);
    const totalCount = this.aggregatedRates.reduce((sum, r) => sum + r.count, 0);

    return {
      avg: allAvg.reduce((a, b) => a + b, 0) / allAvg.length,
      min: Math.min(...allMin),
      max: Math.max(...allMax),
      count: totalCount
    };
  }
}
