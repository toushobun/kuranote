import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{o as i,u as a}from"./iframe-CT2Q14Fw.js";import{n as o,t as s}from"./Chip-D8tX3z-0.js";import{n as c,t as l}from"./Stack-Blj2xom2.js";import{a as u}from"./account-4BFUSYfQ.js";import{t as d}from"./accounts-Co4y6Aco.js";import{n as f,r as p}from"./accountMessages-HH9xXhyX.js";import{a as m,c as h,s as g}from"./OperationFeedbackDialogs-BELQXgHS.js";import{i as _,r as v,t as y}from"./bottomNavigationLayout-BL-CftNz.js";import{n as b,t as x}from"./AccountList-BIQi7_oc.js";import{n as S,t as C}from"./AccountSummaryCard-BtKn6jfb.js";import{n as w,t as T}from"./CreateButton-BjWYk87r.js";import{n as E,r as D,t as O}from"./SettingsPageLayout-GoKTHD7J.js";import{n as k,t as A}from"./useClearQueryParam-XgYvBvma.js";import{i as j,t as M}from"./TransactionAmountKeypadLauncher-Qef8BQTV.js";function N({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,initialErrorKey:o=null,initialErrorMessage:s=null,holderOptions:l,placeholderHolderOptions:d=[],saveResult:p=null,updateAccountAction:h}){let[v,b]=(0,I.useState)(`all`),[S,w]=(0,I.useState)([]),E=(0,I.useRef)(0),A=(0,I.useRef)(new Set),[j,N]=(0,I.useState)(p),[R,z]=(0,I.useState)(p!==null),[H,U]=(0,I.useState)(p),[W,G]=(0,I.useActionState)(h,L),[K,q]=(0,I.useActionState)(t,L),J=k(`result`);(0,I.useEffect)(()=>{let e=[{error:s??void 0,errorKey:o??void 0},W,K];for(let t of e){if(!t.error||!t.errorKey||A.current.has(t.errorKey))continue;A.current.add(t.errorKey),E.current+=1;let e=`${t.errorKey}-${E.current}`;w(n=>[...n,{id:e,message:t.error}])}},[K,o,s,W]),p!==H&&(U(p),p!==null&&(N(p),z(!0)));let Y=(0,I.useMemo)(()=>v===`all`?e:e.filter(e=>e.type===v),[e,v]),X=v!==`all`&&Y.length===0,Z=V[j??`updated`];function Q(e){w(t=>t.filter(t=>t.id!==e))}function $(){z(!1),J()}return(0,F.jsxs)(O,{action:r?(0,F.jsx)(T,{href:a.accountsNew,size:`small`,sx:D,children:f.create}):null,back:{href:a.settings,label:f.backToSettings},subtitle:f.subtitle,title:f.title,children:[(0,F.jsxs)(c,{spacing:1.35,children:[(0,F.jsx)(C,{accounts:e,baseCurrency:n}),(0,F.jsxs)(c,{direction:`row`,spacing:.7,sx:B,children:[(0,F.jsx)(P,{label:`全部`,selected:v===`all`,onClick:()=>b(`all`)}),u.filter(e=>e.value!==`other`).map(e=>(0,F.jsx)(P,{label:e.label,selected:v===e.value,onClick:()=>b(e.value)},e.value))]}),(0,F.jsx)(x,{accounts:Y,archiveAccountAction:q,canManageAccounts:r,emptyDescription:X?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:X?`该类型下还没有账户`:void 0,holderOptions:l,placeholderHolderOptions:d,saveResult:p,updateAccountAction:G})]}),i?(0,F.jsx)(M,{}):null,S.map((e,t)=>(0,F.jsx)(m,{aboveModal:!0,bottomOffset:_(t),description:e.message,onClose:()=>Q(e.id),open:!0,title:`账户操作失败`},e.id)),(0,F.jsx)(g,{bottomOffset:y.feedbackBottomOffset,description:Z.description,onClose:$,open:R,title:Z.title})]})}function P({label:e,onClick:t,selected:n}){return(0,F.jsx)(o,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?z:R],variant:n?`filled`:`outlined`})}var F,I,L,R,z,B,V,H=t((()=>{F=r(),s(),l(),I=e(n()),w(),p(),i(),h(),b(),S(),v(),j(),E(),A(),d(),L={},R={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},z={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},B={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},V={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},N.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),U,W,G,K,q,J,Y,X,Z;t((()=>{H(),U={title:`Templates/Accounts/AccountsTemplate`,component:N,args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,holderOptions:[{user_id:`user-1`,display_color:`sky`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},W={name:`账户页面`},G={name:`无账户`,args:{accounts:[]}},K={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},q={name:`保存成功反馈`,args:{saveResult:`updated`}},J={name:`新增成功反馈`,args:{saveResult:`created`}},Y={name:`删除成功反馈`,args:{saveResult:`archived`}},X={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_color:`sakura`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_color:`lime`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-3`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,has_transactions:!1,holders:[]}]}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "账户页面"
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accounts: []
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "错误反馈弹窗",
  args: {
    initialErrorKey: "story-error-key-1",
    initialErrorMessage: "账户新增失败。请确认账户名称是否重复，或稍后重试。"
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "保存成功反馈",
  args: {
    saveResult: "updated"
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "新增成功反馈",
  args: {
    saveResult: "created"
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "删除成功反馈",
  args: {
    saveResult: "archived"
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "多持有人多账户",
  args: {
    holderOptions: [{
      user_id: "user-1",
      display_color: "sakura" as const,
      display_name: "本地开发用户",
      email: "local1@example.test"
    }, {
      user_id: "user-2",
      display_color: "lime" as const,
      display_name: "本地开发用户2",
      email: "local2@example.test"
    }],
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
}`,...X.parameters?.docs?.source}}},Z=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Y as ArchiveSucceeded,J as CreateSucceeded,W as Default,G as Empty,X as MultipleHolders,q as SaveSucceeded,K as WithError,Z as __namedExportsOrder,U as default};