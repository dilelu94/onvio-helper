# Pitfalls Research: Common Onvio Automation Issues

## Identified Automation Challenges

1. **Session Timeouts**:
   - Onvio often implements strict inactivity timeouts. Tests that take too long executing slow UI operations may fail randomly.
   - *Mitigation*: Ensure tests are atomic and utilize API endpoints for setup/teardown where possible to bypass the UI and save time.

2. **'Repetitive Date' Errors**:
   - Kendo DatePickers can be finicky when typing dates rapidly. Often, the format isn't recognized, or a repetitive input triggers a validation loop.
   - *Mitigation*: Focus the input, clear it entirely, type the date slowly, and explicitly send an 'Enter' or 'Tab' key press to trigger the internal change event.

3. **Kendo UI Filter Lags**:
   - Applying filters to large Kendo grids often results in a noticeable UI freeze or lag while the data source is queried and the DOM is re-rendered.
   - *Mitigation*: Do not rely solely on implicit waits after filtering. Explicitly wait for the grid's loading indicator to appear and then disappear, or wait for the specific backend API response.
