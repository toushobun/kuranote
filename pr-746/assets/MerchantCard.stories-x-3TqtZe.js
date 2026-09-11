import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{b as i,g as a,l as o,u as s,v as c,x as l,y as u}from"./iframe-CcGKUEDJ.js";import{n as d,t as f}from"./Stack-DRbcmy6F.js";import{n as p,t as m}from"./Box-B7FeOMN3.js";import{n as h,t as g}from"./Typography-CwLqrFKa.js";import{n as _,r as v}from"./DynamicMuiThemeProvider-DZrB4iO3.js";import{n as y,r as b,t as x}from"./merchants-RfyI_T8F.js";import{n as S,t as C}from"./MerchantCard-BpcUczI3.js";function w(){return(0,T.jsx)(d,{spacing:1.5,children:c.map(e=>{let t=u[e];return(0,T.jsx)(l,{theme:_(e),children:(0,T.jsx)(p,{style:o(e),sx:{bgcolor:`background.default`,border:1,borderColor:`divider`,borderRadius:2,p:2},children:(0,T.jsxs)(d,{spacing:1,children:[(0,T.jsx)(h,{sx:{fontWeight:700},children:t.name}),(0,T.jsx)(C,{editHref:`/merchants/merchant-1/edit`,ledgerId:`ledger-1`,merchant:D,setPreferredAliasAction:async()=>{}})]})})},e)})})}var T,E,D,O,k,A,j,M,N,P,F,I;t((()=>{T=r(),m(),f(),i(),g(),E=e(n()),b(),v(),s(),a(),S(),D=y({aliases:[x({is_preferred:!0}),x({alias:`LIFE`,id:`alias-2`,sort_order:2})],display_name:`来福`,note:`常去的超市`,tags:[{icon:`🛒`,id:`tag-supermarket`,merchant_count:1,name:`超市`,sort_order:1},{icon:`🧴`,id:`tag-daily`,merchant_count:1,name:`日用`,sort_order:2},{icon:`🛋️`,id:`tag-home`,merchant_count:1,name:`家居`,sort_order:3}]}),O={title:`Organisms/Merchants/MerchantCard`,component:C,args:{setPreferredAliasAction:async()=>{},editHref:`/merchants/merchant-1/edit`,ledgerId:`ledger-1`,merchant:D}},k={name:`正式名身份与首选别名`},A={name:`无别名`,args:{editHref:`/merchants/merchant-1/edit`,ledgerId:`ledger-1`,merchant:y({aliases:[]})}},j={name:`全部个人主题对比`,render:()=>(0,T.jsx)(w,{})},M={name:`点击名称切换显示名`,render:function(e){let[t,n]=(0,E.useState)(e.merchant);return(0,T.jsx)(C,{...e,merchant:t,setPreferredAliasAction:async e=>{let t=e.get(`aliasId`);n(e=>({...e,display_name:e.aliases.find(e=>e.id===t)?.alias??e.name,aliases:e.aliases.map(e=>({...e,is_preferred:e.id===t}))}))}})}},N={name:`切换处理中`,args:{pending:!0}},P={name:`正式名身份与当前显示名同时标记`,args:{merchant:{...D,display_name:D.name,aliases:D.aliases.map(e=>({...e,is_preferred:!1}))}}},F={name:`只读成员`,args:{canManageMerchants:!1}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "正式名身份与首选别名"
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "无别名",
  args: {
    editHref: "/merchants/merchant-1/edit",
    ledgerId: "ledger-1",
    merchant: createMerchantRow({
      aliases: []
    })
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "全部个人主题对比",
  render: () => <MerchantCardThemePreview />
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "点击名称切换显示名",
  render: function InteractiveNames(args) {
    const [merchant, setMerchant] = useState(args.merchant);
    return <MerchantCard {...args} merchant={merchant} setPreferredAliasAction={async data => {
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
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "切换处理中",
  args: {
    pending: true
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "正式名身份与当前显示名同时标记",
  args: {
    merchant: {
      ...merchant,
      display_name: merchant.name,
      aliases: merchant.aliases.map(alias => ({
        ...alias,
        is_preferred: false
      }))
    }
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "只读成员",
  args: {
    canManageMerchants: false
  }
}`,...F.parameters?.docs?.source}}},I=[`Default`,`WithoutAliases`,`MultipleThemes`,`Interactive`,`Pending`,`FormalNameSelected`,`ReadOnly`]}))();export{k as Default,P as FormalNameSelected,M as Interactive,j as MultipleThemes,N as Pending,F as ReadOnly,A as WithoutAliases,I as __namedExportsOrder,O as default};