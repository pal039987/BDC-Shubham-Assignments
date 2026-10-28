const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3005;

function isServerRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/info`, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      try { req.destroy(); } catch (e) {}
      resolve(false);
    });
  });
}

async function waitForServer(port, maxTries = 30) {
  for (let i = 0; i < maxTries; i++) {
    if (await isServerRunning(port)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

const testFiles = [
  'test/vtrade.test.js',
  'test/order_placement_e2e.test.js',
  'test/vtrade_coinbase_luxury_ui.test.js',
  'test/strict_auth_and_user_db.test.js',
  'test/rasta1_standalone_inapp_db.test.js',
  'test/coin_icons_and_offline_assets.test.js',
  'test/fullscreen_broker_and_3d_onboarding.test.js',
  'test/desktop_order_and_layout.test.js',
  'test/premium_animation_and_interactions.test.js',
  'test/signout_marquee_words_fix.test.js',
  'test/mobile_apk_showcase.test.js',
  'test/gsap_scroll_trigger.test.js',
  'test/hero_glass_block_interactions.test.js',
  'test/spotlight_markets_upgrade.test.js',
  'test/trade_desk_chart_width_ledger.test.js',
  'test/trade_desk_cards_and_header_reorganization.test.js',
  'test/shark_exchange_positions_and_zero_scroll.test.js',
  'test/custom_balance_and_real_label.test.js',
  'test/layout_stability_on_order_placement.test.js',
  'test/browser_tab_favicon.test.js',
  'test/my_profile_and_pnl_dashboard.test.js',
  'test/shark_exchange_landing_page.test.js',
  'test/guest_gating_and_credentials_protection.test.js',
  'test/four_problems_flicker_auth_marquee_timer.test.js',
  'test/trade_now_and_instant_ticker.test.js',
  'test/chart_change_sync_and_fullscreen_icon.test.js',
  'test/coin_prices_and_gold_chart_sync.test.js'
];

async function main() {
  let child = null;
  const running = await isServerRunning(PORT);
  if (!running) {
    child = spawn('node', [path.join(__dirname, '../backend/server.js')], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'ignore'
    });
    const ready = await waitForServer(PORT);
    if (!ready) {
      if (child) child.kill();
      console.error(`Failed to start test server on port ${PORT}`);
      process.exit(1);
    }
  }

  function cleanup() {
    if (child) {
      try { child.kill('SIGTERM'); } catch (e) {}
    }
  }

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });
  process.on('SIGTERM', () => { cleanup(); process.exit(1); });

  for (const testFile of testFiles) {
    const fullPath = path.join(__dirname, '..', testFile);
    await new Promise((resolve, reject) => {
      const proc = spawn('node', [fullPath], {
        env: { ...process.env, PORT: String(PORT) },
        stdio: 'inherit'
      });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Test failed: ${testFile} (exit code ${code})`));
      });
    });
  }

  console.log('\n========================================');
  console.log('🎉 ALL 27 VTRADE TEST SUITES PASSED SUCCESSFULLY!');
  console.log('========================================\n');
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});

