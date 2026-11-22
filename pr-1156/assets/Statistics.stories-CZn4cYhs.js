import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Typography-B_0Lz4TE.js";import{r as i,s as a}from"./paths-Cn5DhC5u.js";import{R as o,g as s,h as c,z as l}from"./iframe-Cn9gBdg6.js";import{n as u,t as d}from"./Stack-CedAN9w3.js";import{g as f,s as p}from"./transactions-6wUrxfJW.js";import{n as m,t as h}from"./SectionCard-CsKSLqHZ.js";import{n as g,t as _}from"./MonthNavButton-w85wRqzR.js";import{n as v,t as y}from"./MissingExchangeRateNote-Cejes15x.js";import{n as b,r as x,t as S}from"./userThemeCardSx-vnoApgu-.js";import{n as C,t as w}from"./EmptyState-B9URKLVJ.js";import{n as T,t as E}from"./PageHeader-_QymPXxU.js";var D,O=e((()=>{D=`分类排行按明细统计，与月度合计可能存在差异（同一笔内的抵扣）`}));function k({categoryExpenseRanking:e,ledgerName:t,merchantExpenseRanking:r,monthLabel:i,nextMonth:o,previousMonth:s,summary:c}){let l=r.length>0||e.length>0,d=Number(c.expense);return(0,F.jsxs)(u,{spacing:2,sx:I,children:[(0,F.jsx)(E,{title:`统计`,subtitle:(0,F.jsxs)(u,{spacing:.5,children:[(0,F.jsxs)(`span`,{children:[`当前账本：`,t]}),(0,F.jsx)(n,{color:`textSecondary`,variant:`body2`,children:`按月份整理收支、分类和商家，让家庭账本一眼看清。`})]})}),(0,F.jsxs)(h,{sx:L,children:[(0,F.jsxs)(u,{direction:`row`,sx:{alignItems:`center`,justifyContent:`space-between`},children:[(0,F.jsx)(_,{href:a(s),children:`‹ 上个月`}),(0,F.jsxs)(u,{spacing:.2,sx:{alignItems:`center`,minWidth:0},children:[(0,F.jsx)(n,{component:`p`,sx:{fontWeight:900,lineHeight:1.2},variant:`h6`,children:i}),(0,F.jsx)(n,{color:`textSecondary`,variant:`caption`,children:`月度收支概览`})]}),(0,F.jsx)(_,{href:a(o),children:`下个月 ›`})]}),(0,F.jsxs)(u,{direction:{xs:`column`,sm:`row`},spacing:1.5,sx:{mt:2},children:[(0,F.jsx)(A,{amount:p(c.income,c.currency),label:`本月收入`,tone:`income`}),(0,F.jsx)(A,{amount:p(c.expense,c.currency),label:`本月支出`,tone:`expense`}),(0,F.jsx)(A,{amount:p(c.balance,c.currency),label:`本月净收支`,tone:`balance`})]}),(0,F.jsx)(y,{missingRateCount:c.missingRateCount,marginTop:1})]}),l?(0,F.jsxs)(u,{direction:{xs:`column`,md:`row`},spacing:2,children:[(0,F.jsx)(j,{currency:c.currency,emptyDescription:`这个月还没有分类支出记录。`,items:e,note:D,title:`分类支出汇总`,totalExpense:d}),(0,F.jsx)(j,{currency:c.currency,emptyDescription:`这个月还没有支出记录。`,items:r,title:`商家支出排行`,totalExpense:d})]}):(0,F.jsx)(w,{description:`这个月还没有可以统计的收入或支出。`,title:`暂无统计数据`})]})}function A({amount:e,label:t,tone:r}){return(0,F.jsxs)(u,{sx:R,children:[(0,F.jsx)(n,{color:`textSecondary`,sx:{fontSize:12,fontWeight:800},children:t}),(0,F.jsx)(n,{component:`p`,sx:{color:z[r],fontWeight:900,mt:.7,overflowWrap:`anywhere`},variant:`h6`,children:e})]})}function j({currency:e,emptyDescription:t,items:r,note:i,title:a,totalExpense:o}){return(0,F.jsxs)(h,{sx:B,children:[(0,F.jsxs)(u,{direction:`row`,sx:{alignItems:`center`,justifyContent:`space-between`},children:[(0,F.jsx)(n,{component:`h2`,variant:`h6`,sx:{fontWeight:900},children:a}),(0,F.jsxs)(n,{sx:V,variant:`caption`,children:[r.length,` 项`]})]}),i&&(0,F.jsx)(n,{color:`textSecondary`,variant:`body2`,sx:{mt:1},children:i}),r.length>0?(0,F.jsx)(u,{spacing:0,sx:{mt:1.5},children:r.map((t,n)=>(0,F.jsx)(M,{currency:e,item:t,rank:n+1,totalExpense:o},t.id))}):(0,F.jsx)(n,{color:`textSecondary`,sx:{mt:2},children:t})]})}function M({currency:e,item:t,rank:r,totalExpense:i}){let a=P(t.amount,i);return(0,F.jsxs)(u,{spacing:1,sx:H,children:[(0,F.jsxs)(u,{direction:`row`,spacing:1.2,sx:{alignItems:`flex-start`,justifyContent:`space-between`},children:[(0,F.jsxs)(u,{direction:`row`,spacing:1.1,sx:{minWidth:0},children:[(0,F.jsx)(l,{"aria-hidden":!0,sx:U,children:r}),(0,F.jsxs)(u,{spacing:.4,sx:{minWidth:0},children:[(0,F.jsx)(n,{noWrap:!0,sx:{fontWeight:800},children:t.name}),(0,F.jsxs)(n,{color:`textSecondary`,variant:`body2`,children:[t.transactionCount,` 笔 · 占比 `,a,`%`]})]})]}),(0,F.jsx)(n,{sx:{flexShrink:0,fontWeight:900,textAlign:`right`},children:p(t.amount,e)})]}),(0,F.jsx)(N,{label:`${t.name}支出占比`,value:a})]})}function N({label:e,value:t}){return(0,F.jsx)(l,{"aria-label":e,"aria-valuemax":100,"aria-valuemin":0,"aria-valuenow":t,role:`progressbar`,sx:W,children:(0,F.jsx)(l,{sx:{backgroundColor:`var(--user-theme-budget-bar-1)`,borderRadius:`${c.radius.full}px`,height:`100%`,width:`${t}%`}})})}function P(e,t){let n=Number(e);return!Number.isFinite(n)||t<=0?0:Math.min(100,Math.round(n/t*100))}var F,I,L,R,z,B,V,H,U,W,G=e((()=>{F=t(),O(),o(),d(),r(),i(),v(),g(),C(),m(),T(),s(),S(),f(),I={px:{xs:c.spacing.page.mobile,sm:c.spacing.page.desktop},py:{xs:c.spacing.page.mobile,sm:c.spacing.page.desktop}},L={borderRadius:`${c.radius.xl}px`,p:{xs:2,sm:2.5}},R={backgroundColor:`var(--user-theme-tx-summary-bg)`,...x,borderRadius:`${c.radius.lg}px`,flex:1,minWidth:0,p:1.5},z={balance:`var(--user-theme-balance-text)`,expense:`var(--user-theme-negative-amount)`,income:`var(--user-theme-income-amount)`},B={borderRadius:`${c.radius.xl}px`,flex:1,p:{xs:2,sm:2.5}},V={backgroundColor:`var(--user-theme-bottom-nav-active-bg)`,borderRadius:`${c.radius.full}px`,color:`var(--user-theme-action-text)`,fontWeight:800,px:1,py:.25},H={borderTop:b,py:1.5,"&:first-of-type":{borderTop:0,pt:0},"&:last-of-type":{pb:0}},U={alignItems:`center`,backgroundColor:`var(--user-theme-icon-badge-bg)`,borderRadius:`${c.radius.md}px`,color:`var(--user-theme-icon-badge-color)`,display:`inline-flex`,flexShrink:0,fontSize:12,fontWeight:900,height:26,justifyContent:`center`,mt:.1,width:26},W={backgroundColor:`var(--user-theme-bottom-nav-active-bg)`,borderRadius:`${c.radius.full}px`,height:8,overflow:`hidden`},k.__docgenInfo={description:``,methods:[],displayName:`StatisticsTemplate`}})),K,q,J,Y,X,Z,Q;e((()=>{G(),K={categoryExpenseRanking:[{amount:`2500`,id:`category-food`,name:`食费 / 外食`,transactionCount:2},{amount:`1200`,id:`category-daily`,name:`日用品`,transactionCount:1}],ledgerName:`家庭账本`,merchantExpenseRanking:[{amount:`3000`,id:`merchant-super`,name:`超市`,transactionCount:2},{amount:`700`,id:`merchant-cafe`,name:`咖啡店`,transactionCount:1}],month:`2026-06`,monthLabel:`2026年6月`,nextMonth:`2026-07`,previousMonth:`2026-05`,summary:{balance:`246700`,currency:`JPY`,expense:`3300`,income:`250000`}},q={title:`Templates/Statistics/StatisticsTemplate`,component:k,args:K},J={name:`统计页面`},Y={name:`含外币交易：部分缺少汇率`,args:{...K,summary:{...K.summary,missingRateCount:2}}},X={args:{...K,categoryExpenseRanking:[],merchantExpenseRanking:[],summary:{balance:`0`,currency:`JPY`,expense:`0`,income:`0`}},name:`无统计数据`},Z={name:`同笔抵扣：商家按净支出、分类按明细`,args:{categoryExpenseRanking:[{id:`phone`,name:`数码产品`,amount:`8000`,transactionCount:1}],merchantExpenseRanking:[{id:`apple`,name:`苹果店`,amount:`4000`,transactionCount:1}],summary:{balance:`-4000`,currency:`JPY`,expense:`4000`,income:`0`}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "统计页面"
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "含外币交易：部分缺少汇率",
  args: {
    ...defaultArgs,
    summary: {
      ...defaultArgs.summary,
      missingRateCount: 2
    }
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    ...defaultArgs,
    categoryExpenseRanking: [],
    merchantExpenseRanking: [],
    summary: {
      balance: "0",
      currency: "JPY",
      expense: "0",
      income: "0"
    }
  },
  name: "无统计数据"
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "同笔抵扣：商家按净支出、分类按明细",
  args: {
    categoryExpenseRanking: [{
      id: "phone",
      name: "数码产品",
      amount: "8000",
      transactionCount: 1
    }],
    merchantExpenseRanking: [{
      id: "apple",
      name: "苹果店",
      amount: "4000",
      transactionCount: 1
    }],
    summary: {
      balance: "-4000",
      currency: "JPY",
      expense: "4000",
      income: "0"
    }
  }
}`,...Z.parameters?.docs?.source}}},Q=[`Default`,`ForeignCurrencyRateMissing`,`Empty`,`MixedRecord`]}))();export{J as Default,X as Empty,Y as ForeignCurrencyRateMissing,Z as MixedRecord,Q as __namedExportsOrder,q as default};