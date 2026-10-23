import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const directory = path.dirname(fileURLToPath(import.meta.url));
export const sum = values => values.reduce((a, b) => a + b, 0);
export const round = value => Math.round((value + Number.EPSILON) * 1e8) / 1e8;
export function calculate(inputs) {
  const d = inputs.drivers;
  const launch = sum(inputs.initial_work.map(x => x.hours * x.rate));
  const running = sum(inputs.monthly_running.map(x => x.units * x.rate));
  const contingency = (launch + running * 9) * d.contingency_rate;
  const sessions = [...inputs.year1_qualified_sessions, ...inputs.year2_qualified_sessions];
  const departures = [...inputs.year1_incremental_departures, ...inputs.year2_incremental_departures];
  const scenarios = {};
  const monthly = [];
  for (const [name, multiplier] of [['base', 1], ['downside', d.downside_traveler_multiplier]]) {
    let cumulative = 0;
    const rows = sessions.map((qualified_sessions, i) => {
      const start = new Date(inputs.forecast_start);
      start.setUTCMonth(start.getUTCMonth() + i);
      const inquiries = qualified_sessions * d.qualified_session_to_inquiry;
      const paid_parties = inquiries * d.inquiry_to_paid_party;
      const unconstrained_travelers = paid_parties * d.travelers_per_party * d.paid_to_completed;
      const base_completed = Math.min(unconstrained_travelers, departures[i] * d.seats_per_incremental_departure);
      const completed = base_completed * multiplier;
      const revenue = completed * d.realized_price;
      const delivery = revenue * d.tour_delivery_share;
      const payment = revenue * d.payment_fee_share;
      const service = completed * d.variable_service_per_traveler;
      const contribution = revenue - delivery - payment - service;
      const operating = i >= 3 ? running : 0;
      const marketing = i >= 3 ? inputs.monthly_marketing : 0;
      const development = i < 3 ? launch * inputs.initial_cash_weights[i] : 0;
      const reserve = i === 2 ? contingency : 0;
      const cash_flow = contribution + d.evidenced_cash_savings - operating - marketing - development - reserve;
      cumulative += cash_flow;
      const legacy_travelers = inputs.case.travelers_2025 * inputs.legacy_monthly_seasonality[i % 12];
      const total_departures = Math.ceil((legacy_travelers + completed) / d.seats_per_incremental_departure);
      const guide_days = total_departures * d.guide_days_per_departure_including_buffer;
      const guide_capacity_days = inputs.case.freelance_guides_approximate * d.available_days_per_guide_per_month;
      return Object.fromEntries(Object.entries({
        scenario: name, month: i + 1, period: start.toISOString().slice(0, 7), year: i < 12 ? 1 : 2,
        qualified_sessions, inquiries, paid_parties, unconstrained_travelers, planned_incremental_departures: departures[i],
        incremental_capacity: departures[i] * d.seats_per_incremental_departure, base_completed, completed,
        incremental_foreign: completed * d.incremental_foreign_share,
        incremental_domestic: completed * (1 - d.incremental_foreign_share), revenue, delivery, payment, service, contribution,
        operating, marketing, development, contingency: reserve, cash_flow, cumulative_cash_flow: cumulative,
        funding_required: Math.max(0, -cumulative), gross_cash_uses: delivery + payment + service + operating + marketing + development + reserve,
        legacy_travelers, total_departures, guide_days, guide_capacity_days, guide_utilization: guide_days / guide_capacity_days
      }).map(([k,v]) => [k, typeof v === 'number' ? round(v) : v]));
    });
    const aggregate = subset => {
      const output = {};
      for (const key of ['qualified_sessions', 'inquiries', 'paid_parties', 'completed', 'incremental_foreign', 'incremental_domestic', 'revenue', 'delivery', 'payment', 'service', 'contribution', 'operating', 'marketing', 'development', 'contingency', 'cash_flow', 'gross_cash_uses']) output[key] = round(sum(subset.map(r => r[key])));
      output.project_fixed_envelope = round(output.operating + output.marketing + output.development + output.contingency);
      output.peak_funding_required = Math.max(...subset.map(r => r.funding_required));
      output.marketing_cost_per_incremental_completed = output.completed === 0 ? null : output.marketing / output.completed;
      output.implied_cost_per_paid_session = output.qualified_sessions * d.paid_share_of_sessions === 0 ? null : output.marketing / (output.qualified_sessions * d.paid_share_of_sessions);
      output.peak_guide_utilization = Math.max(...subset.map(r => r.guide_utilization));
      output.foreign_total = inputs.case.annual_foreign_baseline_approximate + output.incremental_foreign;
      output.domestic_total = inputs.case.annual_domestic_baseline_approximate + output.incremental_domestic;
      output.foreign_share = output.foreign_total / (output.foreign_total + output.domestic_total);
      return output;
    };
    const year1 = aggregate(rows.slice(0, 12));
    const year2 = aggregate(rows.slice(12));
    const total24 = aggregate(rows);
    // Annual share is intentionally unavailable in the 24-month total to prevent a denominator error.
    delete total24.foreign_total; delete total24.domestic_total; delete total24.foreign_share;
    const payback = rows.find(r => r.cumulative_cash_flow >= 0)?.month ?? null;
    scenarios[name] = { year1, year2, total24, payback_month: payback, payback_label: payback === null ? 'Not reached within 24 months' : `Month ${payback}`, year2_foreign_target_met: year2.foreign_share >= inputs.case.foreign_share_target, ending_cash_flow: rows.at(-1).cumulative_cash_flow, peak_funding_required: Math.max(...rows.map(r => r.funding_required)), peak_funding_month: rows.reduce((a,b) => b.funding_required > a.funding_required ? b : a).month };
    monthly.push(...rows);
  }
  const required_incremental = (inputs.case.foreign_share_target * inputs.case.travelers_2025 - inputs.case.annual_foreign_baseline_approximate) / (d.incremental_foreign_share - inputs.case.foreign_share_target);
  return {
    summary: {
      version: inputs.model_version, currency: inputs.currency, forecast_start: inputs.forecast_start, forecast_end: monthly[23].period,
      disclosure: inputs.status, case_provenance: inputs.case.source,
      case_reconciliation: {travelers_times_average: inputs.case.travelers_2025 * inputs.case.average_price, stated_revenue: inputs.case.revenue_2025, difference: inputs.case.revenue_2025 - inputs.case.travelers_2025 * inputs.case.average_price, implied_average: inputs.case.revenue_2025 / inputs.case.travelers_2025},
      shared: {initial_work_hours: sum(inputs.initial_work.map(x => x.hours)), initial_work: launch, monthly_running: running, monthly_marketing: inputs.monthly_marketing, contingency, contribution_per_traveler: d.realized_price * (1-d.tour_delivery_share-d.payment_fee_share)-d.variable_service_per_traveler, contribution_margin: 1-d.tour_delivery_share-d.payment_fee_share-d.variable_service_per_traveler/d.realized_price, year2_session_growth_multiple: sum(inputs.year2_qualified_sessions)/sum(inputs.year1_qualified_sessions), year2_incremental_travelers_required_for_target_at_stated_mix: required_incremental, baseline_domestic_approximate: inputs.case.annual_domestic_baseline_approximate, baseline_foreign_approximate: inputs.case.annual_foreign_baseline_approximate, budget: inputs.case.budget},
      scenarios,
      assumptions_and_limitations: inputs.notes
    }, monthly
  };
}

export async function regenerate() {
  const inputs = JSON.parse(await fs.readFile(path.join(directory, 'inputs.json'), 'utf8'));
  const { summary, monthly } = calculate(inputs);
  await fs.writeFile(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  const keys = Object.keys(monthly[0]);
  await fs.writeFile(path.join(directory, 'monthly_cash_flows.csv'), [keys.join(','), ...monthly.map(r => keys.map(k => r[k]).join(','))].join('\n') + '\n');
  console.log(JSON.stringify({shared:summary.shared, base:summary.scenarios.base, downside:summary.scenarios.downside},null,2));
  return { inputs, summary, monthly };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await regenerate();
