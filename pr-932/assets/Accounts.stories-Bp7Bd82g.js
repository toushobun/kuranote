import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{V as i,d as a,i as o,s,z as c}from"./iframe-Cb7IOPpa.js";import{n as l,t as u}from"./Chip-D8tX3z-0.js";import{n as d,t as f}from"./Stack-Blj2xom2.js";import{a as ee}from"./account-4BFUSYfQ.js";import{t as p}from"./accounts-Co4y6Aco.js";import{a as te,c as m,s as ne}from"./OperationFeedbackDialogs-7xb4M5aq.js";import{n as h,r as re,t as ie}from"./bottomNavigationLayout-DiIThXkn.js";import{n as g,t as _}from"./AccountForm-wGE4ciCq.js";import{n as v,r as y,t as b}from"./AccountFormDialogShell-DfsSnsdS.js";import{n as x,t as ae}from"./AccountList-Bx0VcIzs.js";import{n as S,t as oe}from"./AccountSummaryCard-BMc26SOT.js";import{n as C,t as se}from"./CreateButton-Dp1iNdab.js";import{n as w,r as ce,t as le}from"./SettingsPageLayout-BGHwqJ8s.js";import{n as T,t as E}from"./useClearQueryParam-DDYS3OMc.js";import{n as D,t as ue}from"./TransactionAmountKeypadLauncher-DVJNSSaV.js";import{n as O,t as k}from"./accountMessages-0m6WYSVf.js";function A({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:i,placeholderHolderOptions:a=[],returnTo:o=null}){return(0,j.jsx)(v,{illustrationSlot:(0,j.jsx)(b,{}),onClose:r,open:i,children:(0,j.jsx)(_,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r,placeholderHolderOptions:a,returnTo:o})})}var j,M=t((()=>{j=r(),g(),y(),A.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},returnTo:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}}}}}));function N({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:s=!0,createAccountAction:c,initialErrorKey:l=null,initialErrorMessage:u=null,holderOptions:f,openCreateDialog:p=!1,placeholderHolderOptions:m=[],returnTo:h=null,saveResult:g=null,updateAccountAction:_}){let[v,y]=(0,I.useState)(`all`),b=i(),[x,S]=(0,I.useState)(p&&r),[C,w]=(0,I.useState)(p&&r?h:null),[E,D]=(0,I.useState)([]),O=(0,I.useRef)(0),j=(0,I.useRef)(new Set),[M,N]=(0,I.useState)(g),[R,z]=(0,I.useState)(g!==null),[V,H]=(0,I.useState)(g),[U,W]=(0,I.useActionState)(c,L),[G,K]=(0,I.useActionState)(_,L),[q,J]=(0,I.useActionState)(t,L),Y=T(`result`),X=T(o,`returnTo`);(0,I.useEffect)(()=>{p&&X()},[p]),(0,I.useEffect)(()=>{let e=[{error:u??void 0,errorKey:l??void 0},U,G,q];for(let t of e){if(!t.error||!t.errorKey||j.current.has(t.errorKey))continue;j.current.add(t.errorKey),O.current+=1;let e=`${t.errorKey}-${O.current}`;D(n=>[...n,{id:e,message:t.error}])}},[q,U,l,u,G]),g!==V&&(H(g),g!==null&&(N(g),z(!0),S(!1),w(null)));let Z=(0,I.useMemo)(()=>v===`all`?e:e.filter(e=>e.type===v),[e,v]),Q=v!==`all`&&Z.length===0,$=B[M??`updated`];function fe(e){D(t=>t.filter(t=>t.id!==e))}function pe(){w(null),S(!0)}function me(){S(!1),C&&(w(null),b.push(C))}function he(){z(!1),Y()}return(0,F.jsxs)(le,{action:r?(0,F.jsx)(se,{onClick:pe,size:`small`,sx:ce,children:k.create}):null,back:{href:a.settings,label:k.backToSettings},subtitle:k.subtitle,title:k.title,children:[(0,F.jsxs)(d,{spacing:1.35,children:[(0,F.jsx)(oe,{accounts:e,baseCurrency:n}),(0,F.jsxs)(d,{direction:`row`,spacing:.7,sx:de,children:[(0,F.jsx)(P,{label:`全部`,selected:v===`all`,onClick:()=>y(`all`)}),ee.filter(e=>e.value!==`other`).map(e=>(0,F.jsx)(P,{label:e.label,selected:v===e.value,onClick:()=>y(e.value)},e.value))]}),(0,F.jsx)(ae,{accounts:Z,archiveAccountAction:J,canManageAccounts:r,emptyDescription:Q?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:Q?`该类型下还没有账户`:void 0,holderOptions:f,placeholderHolderOptions:m,saveResult:g,updateAccountAction:K})]}),s?(0,F.jsx)(ue,{}):null,r?(0,F.jsx)(A,{createAccountAction:W,defaultCurrency:n,holderOptions:f,onClose:me,placeholderHolderOptions:m,open:x,returnTo:C}):null,E.map((e,t)=>(0,F.jsx)(te,{aboveModal:!0,bottomOffset:re(t),description:e.message,onClose:()=>fe(e.id),open:!0,title:`账户操作失败`},e.id)),(0,F.jsx)(ne,{bottomOffset:ie.feedbackBottomOffset,description:$.description,onClose:he,open:R,title:$.title})]})}function P({label:e,onClick:t,selected:n}){return(0,F.jsx)(l,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?z:R],variant:n?`filled`:`outlined`})}var F,I,L,R,z,de,B,V=t((()=>{F=r(),u(),f(),c(),I=e(n()),C(),O(),s(),m(),M(),x(),S(),h(),D(),w(),E(),p(),L={},R={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},z={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},de={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},B={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},N.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},openCreateDialog:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},returnTo:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),H,U,W,G,K,q,J,Y,X;t((()=>{V(),H={title:`Templates/Accounts/AccountsTemplate`,component:N,args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},U={name:`账户页面`},W={name:`无账户`,args:{accounts:[]}},G={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},K={name:`保存成功反馈`,args:{saveResult:`updated`}},q={name:`新增成功反馈`,args:{saveResult:`created`}},J={name:`删除成功反馈`,args:{saveResult:`archived`}},Y={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-3`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,has_transactions:!1,holders:[]}]}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "账户页面"
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accounts: []
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "错误反馈弹窗",
  args: {
    initialErrorKey: "story-error-key-1",
    initialErrorMessage: "账户新增失败。请确认账户名称是否重复，或稍后重试。"
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "保存成功反馈",
  args: {
    saveResult: "updated"
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "新增成功反馈",
  args: {
    saveResult: "created"
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "删除成功反馈",
  args: {
    saveResult: "archived"
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "多持有人多账户",
  args: {
    holderOptions: [{
      user_id: "user-1",
      display_name: "本地开发用户",
      email: "local1@example.test"
    }, {
      user_id: "user-2",
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
}`,...Y.parameters?.docs?.source}}},X=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{J as ArchiveSucceeded,q as CreateSucceeded,U as Default,W as Empty,Y as MultipleHolders,K as SaveSucceeded,G as WithError,X as __namedExportsOrder,H as default};