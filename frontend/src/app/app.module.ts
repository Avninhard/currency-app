import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { CurrencyFilterComponent } from './components/currency-filter/currency-filter.component';
import { CurrencyTableComponent } from './components/currency-table/currency-table.component';
import { CurrencyChartComponent } from './components/currency-chart/currency-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    CurrencyFilterComponent,
    CurrencyTableComponent,
    CurrencyChartComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
