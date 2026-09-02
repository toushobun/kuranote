import{i as e}from"./preload-helper-D2yxXLVK.js";import{n as t,t as n}from"./MerchantDetailsFields-MtGelB7d.js";var r,i,a,o,s,c,l,u,d,f;e((()=>{t(),{expect:r,userEvent:i,within:a}=__STORYBOOK_MODULE_TEST__,o=async()=>({iconUrl:`https://t2.gstatic.com/faviconV2?url=https://example.com`,success:`网站图标已获取，保存后会缓存`}),s={title:`Organisms/Merchants/MerchantDetailsFields`,component:n,args:{fetchIconAction:o,ledgerId:`ledger-1`,name:`示例商家`,note:``,onNameChange:()=>{},onNoteChange:()=>{},onWebsiteUrlChange:()=>{},websiteUrl:`https://example.com`}},c={name:`获取前`},l={args:{fetchIconAction:()=>new Promise(()=>{})},name:`获取中`,play:async({canvasElement:e})=>{await i.click(a(e).getByRole(`button`,{name:`获取图标`})),await r(a(e).getByText(`正在获取并验证网站图标`)).toBeInTheDocument()}},u={args:{initialIconUrl:`https://t2.gstatic.com/faviconV2?url=https://example.com`},name:`获取成功`},d={args:{fetchIconAction:async()=>({error:`未能获取网站图标，请确认网址后重试。`})},name:`获取失败`,play:async({canvasElement:e})=>{await i.click(a(e).getByRole(`button`,{name:`获取图标`})),await r(await a(e).findByText(`未能获取网站图标，请确认网址后重试。`)).toBeInTheDocument()}},c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: "获取前"
}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    fetchIconAction: () => new Promise(() => {})
  },
  name: "获取中",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "获取图标"
    }));
    await expect(within(canvasElement).getByText("正在获取并验证网站图标")).toBeInTheDocument();
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    initialIconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com"
  },
  name: "获取成功"
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    fetchIconAction: async () => ({
      error: "未能获取网站图标，请确认网址后重试。"
    })
  },
  name: "获取失败",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "获取图标"
    }));
    await expect(await within(canvasElement).findByText("未能获取网站图标，请确认网址后重试。")).toBeInTheDocument();
  }
}`,...d.parameters?.docs?.source}}},f=[`Idle`,`Loading`,`Success`,`Error`]}))();export{d as Error,c as Idle,l as Loading,u as Success,f as __namedExportsOrder,s as default};