import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{U as i,V as a,d as o,i as ee,s}from"./iframe-893PY80A.js";import{n as c,t as l}from"./Chip-D8tX3z-0.js";import{n as u,t as d}from"./Stack-Blj2xom2.js";import{a as te}from"./account-4BFUSYfQ.js";import{t as f}from"./accounts-Co4y6Aco.js";import{a as ne,c as p,s as re}from"./OperationFeedbackDialogs-C01vrMrg.js";import{i as ie,r as m,t as ae}from"./bottomNavigationLayout-C_2ibUNE.js";import{n as h,t as g}from"./AccountForm-efKBy4CE.js";import{n as _,r as v,t as y}from"./AccountFormDialogShell-BUt7Psu8.js";import{n as b,t as oe}from"./AccountList-JrNAezmU.js";import{n as x,t as se}from"./AccountSummaryCard-Ze3jbMQi.js";import{n as S,t as ce}from"./CreateButton-CwzTzf_A.js";import{n as C,r as le,t as ue}from"./SettingsPageLayout-ZBfx_pKI.js";import{n as w,t as T}from"./useClearQueryParam-2i2ctQPZ.js";import{i as E,t as de}from"./TransactionAmountKeypadLauncher-BZOshwVR.js";import{n as D,t as O}from"./accountMessages-0m6WYSVf.js";function k({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:i,placeholderHolderOptions:a=[],returnTo:o=null}){return(0,A.jsx)(_,{illustrationSlot:(0,A.jsx)(y,{}),onClose:r,open:i,children:(0,A.jsx)(g,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r,placeholderHolderOptions:a,returnTo:o})})}var A,j=t((()=>{A=r(),h(),v(),k.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},returnTo:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}}}}}));function M({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:a=!0,createAccountAction:s,initialErrorKey:c=null,initialErrorMessage:l=null,holderOptions:d,openCreateDialog:f=!1,placeholderHolderOptions:p=[],returnTo:m=null,saveResult:h=null,updateAccountAction:g}){let[_,v]=(0,F.useState)(`all`),y=i(),[b,x]=(0,F.useState)(f&&r),[S,C]=(0,F.useState)(f&&r?m:null),[T,E]=(0,F.useState)([]),D=(0,F.useRef)(0),A=(0,F.useRef)(new Set),[j,M]=(0,F.useState)(h),[L,R]=(0,F.useState)(h!==null),[V,H]=(0,F.useState)(h),[U,W]=(0,F.useActionState)(s,I),[G,K]=(0,F.useActionState)(g,I),[q,J]=(0,F.useActionState)(t,I),Y=w(`result`),X=w(ee,`returnTo`);(0,F.useEffect)(()=>{f&&X()},[f]),(0,F.useEffect)(()=>{let e=[{error:l??void 0,errorKey:c??void 0},U,G,q];for(let t of e){if(!t.error||!t.errorKey||A.current.has(t.errorKey))continue;A.current.add(t.errorKey),D.current+=1;let e=`${t.errorKey}-${D.current}`;E(n=>[...n,{id:e,message:t.error}])}},[q,U,c,l,G]),h!==V&&(H(h),h!==null&&(M(h),R(!0),x(!1),C(null)));let Z=(0,F.useMemo)(()=>_===`all`?e:e.filter(e=>e.type===_),[e,_]),Q=_!==`all`&&Z.length===0,$=B[j??`updated`];function fe(e){E(t=>t.filter(t=>t.id!==e))}function pe(){C(null),x(!0)}function me(){x(!1),S&&(C(null),y.push(S))}function he(){R(!1),Y()}return(0,P.jsxs)(ue,{action:r?(0,P.jsx)(ce,{onClick:pe,size:`small`,sx:le,children:O.create}):null,back:{href:o.settings,label:O.backToSettings},subtitle:O.subtitle,title:O.title,children:[(0,P.jsxs)(u,{spacing:1.35,children:[(0,P.jsx)(se,{accounts:e,baseCurrency:n}),(0,P.jsxs)(u,{direction:`row`,spacing:.7,sx:z,children:[(0,P.jsx)(N,{label:`全部`,selected:_===`all`,onClick:()=>v(`all`)}),te.filter(e=>e.value!==`other`).map(e=>(0,P.jsx)(N,{label:e.label,selected:_===e.value,onClick:()=>v(e.value)},e.value))]}),(0,P.jsx)(oe,{accounts:Z,archiveAccountAction:J,canManageAccounts:r,emptyDescription:Q?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:Q?`该类型下还没有账户`:void 0,holderOptions:d,placeholderHolderOptions:p,saveResult:h,updateAccountAction:K})]}),a?(0,P.jsx)(de,{}):null,r?(0,P.jsx)(k,{createAccountAction:W,defaultCurrency:n,holderOptions:d,onClose:me,placeholderHolderOptions:p,open:b,returnTo:S}):null,T.map((e,t)=>(0,P.jsx)(ne,{aboveModal:!0,bottomOffset:ie(t),description:e.message,onClose:()=>fe(e.id),open:!0,title:`账户操作失败`},e.id)),(0,P.jsx)(re,{bottomOffset:ae.feedbackBottomOffset,description:$.description,onClose:he,open:L,title:$.title})]})}function N({label:e,onClick:t,selected:n}){return(0,P.jsx)(c,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?R:L],variant:n?`filled`:`outlined`})}var P,F,I,L,R,z,B,V=t((()=>{P=r(),l(),d(),a(),F=e(n()),S(),D(),s(),p(),j(),b(),x(),m(),E(),C(),T(),f(),I={},L={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},R={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},z={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},B={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},M.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},openCreateDialog:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},returnTo:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),H,U,W,G,K,q,J,Y,X;t((()=>{V(),H={title:`Templates/Accounts/AccountsTemplate`,component:M,args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},U={name:`账户页面`},W={name:`无账户`,args:{accounts:[]}},G={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},K={name:`保存成功反馈`,args:{saveResult:`updated`}},q={name:`新增成功反馈`,args:{saveResult:`created`}},J={name:`删除成功反馈`,args:{saveResult:`archived`}},Y={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,has_transactions:!1,holders:[{id:`holder-3`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,has_transactions:!1,holders:[]}]}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
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