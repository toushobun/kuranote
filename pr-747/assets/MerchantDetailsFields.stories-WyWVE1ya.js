import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./MerchantDetailsFields-C45J9deJ.js";var o,s,c,l,u,d,f,p,m,h,g,_,v,y,b,x;t((()=>{o=r(),s=e(n()),i(),{expect:c,userEvent:l,within:u}=__STORYBOOK_MODULE_TEST__,d=async()=>({iconUrl:`https://t2.gstatic.com/faviconV2?url=https://example.com`,success:`网站图标已获取，保存后会缓存`}),f={title:`Organisms/Merchants/MerchantDetailsFields`,component:a,args:{fetchIconAction:d,ledgerId:`ledger-1`,name:`示例商家`,note:``,onNameChange:()=>{},onNoteChange:()=>{},onWebsiteUrlChange:()=>{},websiteUrl:`https://example.com`}},p={name:`获取前`},m={name:`空值：聚焦与失焦对照`,args:{name:``,websiteUrl:``,note:``},render:function(e){let[t,n]=(0,s.useState)(e.name),[r,i]=(0,s.useState)(e.websiteUrl),[c,l]=(0,s.useState)(e.note);return(0,o.jsx)(a,{...e,name:t,websiteUrl:r,note:c,onNameChange:n,onWebsiteUrlChange:i,onNoteChange:l})}},h={...m,name:`空值：商家名称聚焦`,play:async({canvasElement:e})=>{let t=u(e).getByRole(`textbox`,{name:/商家名称/});await l.click(t),await c(t).toHaveFocus()}},g={...m,name:`空值：商家网址聚焦`,play:async({canvasElement:e})=>{let t=u(e).getByRole(`textbox`,{name:`商家网址`});await l.click(t),await c(t).toHaveFocus()}},_={...m,name:`空值：备注聚焦`,play:async({canvasElement:e})=>{let t=u(e).getByRole(`textbox`,{name:`备注（可选）`});await l.click(t),await c(t).toHaveFocus()}},v={args:{fetchIconAction:()=>new Promise(()=>{})},name:`获取中`,play:async({canvasElement:e})=>{await l.click(u(e).getByRole(`button`,{name:`获取图标`})),await c(u(e).getByText(`正在获取并验证网站图标`)).toBeInTheDocument()}},y={args:{initialIconUrl:`https://t2.gstatic.com/faviconV2?url=https://example.com`},name:`获取成功`},b={args:{fetchIconAction:async()=>({error:`未能获取网站图标，请确认网址后重试。`})},name:`获取失败`,play:async({canvasElement:e})=>{await l.click(u(e).getByRole(`button`,{name:`获取图标`})),await c(await u(e).findByText(`未能获取网站图标，请确认网址后重试。`)).toBeInTheDocument()}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "获取前"
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "空值：聚焦与失焦对照",
  args: {
    name: "",
    websiteUrl: "",
    note: ""
  },
  render: function EmptyFieldsStory(args) {
    const [name, setName] = useState(args.name);
    const [websiteUrl, setWebsiteUrl] = useState(args.websiteUrl);
    const [note, setNote] = useState(args.note);
    return <MerchantDetailsFields {...args} name={name} websiteUrl={websiteUrl} note={note} onNameChange={setName} onWebsiteUrlChange={setWebsiteUrl} onNoteChange={setNote} />;
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  ...EmptyFields,
  name: "空值：商家名称聚焦",
  play: async ({
    canvasElement
  }) => {
    const field = within(canvasElement).getByRole("textbox", {
      name: /商家名称/
    });
    await userEvent.click(field);
    await expect(field).toHaveFocus();
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  ...EmptyFields,
  name: "空值：商家网址聚焦",
  play: async ({
    canvasElement
  }) => {
    const field = within(canvasElement).getByRole("textbox", {
      name: "商家网址"
    });
    await userEvent.click(field);
    await expect(field).toHaveFocus();
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  ...EmptyFields,
  name: "空值：备注聚焦",
  play: async ({
    canvasElement
  }) => {
    const field = within(canvasElement).getByRole("textbox", {
      name: "备注（可选）"
    });
    await userEvent.click(field);
    await expect(field).toHaveFocus();
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    initialIconUrl: "https://t2.gstatic.com/faviconV2?url=https://example.com"
  },
  name: "获取成功"
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
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
}`,...b.parameters?.docs?.source}}},x=[`Idle`,`EmptyFields`,`NameFocused`,`WebsiteFocused`,`NoteFocused`,`Loading`,`Success`,`Error`]}))();export{m as EmptyFields,b as Error,p as Idle,v as Loading,h as NameFocused,_ as NoteFocused,y as Success,g as WebsiteFocused,x as __namedExportsOrder,f as default};