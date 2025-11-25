describe('{{PROJECT_NAME}} E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display the main screen', async () => {
    await expect(element(by.text('{{PROJECT_NAME}}'))).toBeVisible();
  });

  it('should show ready message', async () => {
    await expect(element(by.text('Ready for development! 🚀'))).toBeVisible();
  });
});
