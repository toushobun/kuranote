import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./iframe-Dr7ub_a9.js";import{n as o,r as s,t as c}from"./merchants-RfyI_T8F.js";import{n as l,t as u}from"./MerchantDisplayNameEditor-BFk9gYty.js";var d,f,p,m,h,g,_,v,y,b;t((()=>{d=r(),f=e(n()),s(),i(),l(),{expect:p,within:m}=__STORYBOOK_MODULE_TEST__,h={title:`Organisms/Merchants/MerchantDisplayNameEditor`,component:u,args:{archiveAliasAction:async()=>{},createAliasAction:async()=>{},merchant:o({aliases:[c({alias:`晨光生活`,is_preferred:!0}),c({alias:`晨光`,id:`alias-2`})],display_name:`晨光生活`,name:`晨光生活超市有限公司`}),setPreferredAliasAction:async()=>{}}},g={name:`显示名与别名管理`,play:async({canvasElement:e})=>{let t=m(e),n=t.getByRole(`button`,{name:`将晨光设为展示名`}),r=n.closest(`form`)?.parentElement,i=t.getByRole(`textbox`,{name:`别名`}),o=i.closest(`.MuiOutlinedInput-root`),s=t.getByRole(`button`,{name:`添加别名`});await p(r).not.toBeNull(),await p(o).not.toBeNull(),await p(o.getBoundingClientRect().left).toBe(r.getBoundingClientRect().left),await p(i.getBoundingClientRect().left+Number.parseFloat(getComputedStyle(i).paddingLeft)).toBe(n.querySelector(`span`).getBoundingClientRect().left),await p(getComputedStyle(o).borderRadius).toBe(`${a.radius.item}px`),await p(getComputedStyle(s).borderRadius).toBe(`${a.radius.item}px`)}},_={name:`正式名为当前展示名`,args:{merchant:o({aliases:[],display_name:`晨光生活超市有限公司`,name:`晨光生活超市有限公司`})}},v={name:`点击名称切换显示名`,render:function(e){let[t,n]=(0,f.useState)(e.merchant);return(0,d.jsx)(u,{...e,merchant:t,setPreferredAliasAction:async e=>{let t=e.get(`aliasId`);n(e=>({...e,display_name:e.aliases.find(e=>e.id===t)?.alias??e.name,aliases:e.aliases.map(e=>({...e,is_preferred:e.id===t}))}))}})}},y={name:`切换处理中`,args:{pending:!0}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "显示名与别名管理",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const nameButton = canvas.getByRole("button", {
      name: "将晨光设为展示名"
    });
    const nameRow = nameButton.closest("form")?.parentElement;
    const aliasInput = canvas.getByRole("textbox", {
      name: "别名"
    });
    const inputRoot = aliasInput.closest(".MuiOutlinedInput-root");
    const addButton = canvas.getByRole("button", {
      name: "添加别名"
    });
    await expect(nameRow).not.toBeNull();
    await expect(inputRoot).not.toBeNull();
    await expect(inputRoot!.getBoundingClientRect().left).toBe(nameRow!.getBoundingClientRect().left);
    await expect(aliasInput.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(aliasInput).paddingLeft)).toBe(nameButton.querySelector("span")!.getBoundingClientRect().left);
    await expect(getComputedStyle(inputRoot!).borderRadius).toBe(\`\${designTokens.radius.item}px\`);
    await expect(getComputedStyle(addButton).borderRadius).toBe(\`\${designTokens.radius.item}px\`);
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "正式名为当前展示名",
  args: {
    merchant: createMerchantRow({
      aliases: [],
      display_name: "晨光生活超市有限公司",
      name: "晨光生活超市有限公司"
    })
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "点击名称切换显示名",
  render: function InteractiveNames(args) {
    const [merchant, setMerchant] = useState(args.merchant);
    return <MerchantDisplayNameEditor {...args} merchant={merchant} setPreferredAliasAction={async data => {
      const aliasId = data.get("aliasId");
      setMerchant(current => ({
        ...current,
        display_name: current.aliases.find(alias => alias.id === aliasId)?.alias ?? current.name,
        aliases: current.aliases.map(alias => ({
          ...alias,
          is_preferred: alias.id === aliasId
        }))
      }));
    }} />;
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "切换处理中",
  args: {
    pending: true
  }
}`,...y.parameters?.docs?.source}}},b=[`Default`,`FormalNameSelected`,`Interactive`,`Pending`]}))();export{g as Default,_ as FormalNameSelected,v as Interactive,y as Pending,b as __namedExportsOrder,h as default};