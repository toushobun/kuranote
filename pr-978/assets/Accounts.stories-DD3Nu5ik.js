import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{d as i,s as a}from"./iframe-Ndklxczx.js";import{n as o,t as s}from"./Chip-D8tX3z-0.js";import{n as c,t as l}from"./Stack-Blj2xom2.js";import{a as u}from"./account-4BFUSYfQ.js";import{t as d}from"./accounts-Co4y6Aco.js";import{n as f,r as p}from"./accountMessages-DxDN5W9h.js";import{c as m,s as h}from"./OperationFeedbackDialogs-D9plu7hM.js";import{r as g,t as _}from"./bottomNavigationLayout-aYiXpI4F.js";import{n as v,t as y}from"./AccountList-BYm_Rzdy.js";import{n as b,t as x}from"./AccountSummaryCard-5iDlYQOH.js";import{n as S,t as C}from"./CreateButton-U_SGWg9u.js";import{n as w,r as T,t as E}from"./SettingsPageLayout-DMYVx1_0.js";import{n as D,t as O}from"./useClearQueryParam-BiVGhts_.js";function k({accounts:e,baseCurrency:t,canManageAccounts:n=!0,saveResult:r=null}){let[a,o]=(0,M.useState)(`all`),[s,l]=(0,M.useState)(r),[d,p]=(0,M.useState)(r!==null),[m,g]=(0,M.useState)(r),v=D(`result`);r!==m&&(g(r),r!==null&&(l(r),p(!0)));let b=(0,M.useMemo)(()=>a===`all`?e:e.filter(e=>e.type===a),[e,a]),S=a!==`all`&&b.length===0,w=I[s??`updated`];function O(){p(!1),v()}return(0,j.jsxs)(E,{action:n?(0,j.jsx)(C,{href:i.accountsNew,size:`small`,sx:T,children:f.create}):null,back:{href:i.settings,label:f.backToSettings},subtitle:f.subtitle,title:f.title,children:[(0,j.jsxs)(c,{spacing:1.35,children:[(0,j.jsx)(x,{accounts:e,baseCurrency:t}),(0,j.jsxs)(c,{direction:`row`,spacing:.7,sx:F,children:[(0,j.jsx)(A,{label:`全部`,selected:a===`all`,onClick:()=>o(`all`)}),u.filter(e=>e.value!==`other`).map(e=>(0,j.jsx)(A,{label:e.label,selected:a===e.value,onClick:()=>o(e.value)},e.value))]}),(0,j.jsx)(y,{accounts:b,canManageAccounts:n,emptyDescription:S?`请切换其他账户类型。`:n?void 0:`当前账本还没有可查看的账户。`,emptyTitle:S?`该类型下还没有账户`:void 0})]}),(0,j.jsx)(h,{bottomOffset:_.feedbackBottomOffset,description:w.description,onClose:O,open:d,title:w.title})]})}function A({label:e,onClick:t,selected:n}){return(0,j.jsx)(o,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?P:N],variant:n?`filled`:`outlined`})}var j,M,N,P,F,I,L=t((()=>{j=r(),s(),l(),M=e(n()),S(),p(),a(),m(),v(),b(),g(),w(),O(),d(),N={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},P={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},F={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},I={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},k.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}}}}})),R,z,B,V,H,U,W,G;t((()=>{L(),R={title:`Templates/Accounts/AccountsTemplate`,component:k,args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[]}],baseCurrency:`JPY`}},z={name:`账户页面`},B={name:`无账户`,args:{accounts:[]}},V={name:`保存成功反馈`,args:{saveResult:`updated`}},H={name:`新增成功反馈`,args:{saveResult:`created`}},U={name:`删除成功反馈`,args:{saveResult:`archived`}},W={name:`多持有人多账户`,args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-3`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,has_transactions:!1,holders:[]}]}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "账户页面"
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accounts: []
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "保存成功反馈",
  args: {
    saveResult: "updated"
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "新增成功反馈",
  args: {
    saveResult: "created"
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "删除成功反馈",
  args: {
    saveResult: "archived"
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "多持有人多账户",
  args: {
    accounts: [{
      id: "00000000-0000-4000-8000-000000000001",
      name: "三菱UFJ银行",
      type: "bank",
      currency: "JPY",
      initial_balance: 100000,
      current_balance: 85000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      has_transactions: false,
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "co_owner",
        share_ratio: null
      }, {
        id: "holder-2",
        user_id: "user-2",
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "co_owner",
        share_ratio: null
      }]
    }, {
      id: "00000000-0000-4000-8000-000000000002",
      name: "楽天カード",
      type: "credit_card",
      currency: "JPY",
      initial_balance: 0,
      current_balance: -12500,
      sort_order: 2,
      created_at: "2026-01-02T00:00:00.000Z",
      has_transactions: false,
      holders: [{
        id: "holder-3",
        user_id: "user-2",
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "owner",
        share_ratio: null
      }]
    }, {
      id: "00000000-0000-4000-8000-000000000003",
      name: "PayPay",
      type: "e_money",
      currency: "JPY",
      initial_balance: 0,
      current_balance: 3200,
      sort_order: 3,
      created_at: "2026-01-03T00:00:00.000Z",
      has_transactions: false,
      holders: []
    }]
  }
}`,...W.parameters?.docs?.source}}},G=[`Default`,`Empty`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{U as ArchiveSucceeded,H as CreateSucceeded,z as Default,B as Empty,W as MultipleHolders,V as SaveSucceeded,G as __namedExportsOrder,R as default};