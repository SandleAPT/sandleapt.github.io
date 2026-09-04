param([string]$Period = "2026-07", [string]$Prev = "2026-06")
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$root = "D:\Main\fees"
$fail = 0; $warn = 0
function Bad($m)  { Write-Output ("FAIL  " + $m); $script:fail++ }
function Warn($m) { Write-Output ("WARN  " + $m); $script:warn++ }
function Ok($m)   { Write-Output ("ok    " + $m) }

# 1. parse all
$files = @("data.json","categories.json","data-2026.json","detail-2026.json","reviews.json","decisions.json")
$J = @{}
foreach ($f in $files) {
  try { $J[$f] = Get-Content -Raw -Encoding UTF8 (Join-Path $root $f) | ConvertFrom-Json; Ok "parse $f" }
  catch { Bad "parse $f : $($_.Exception.Message)" }
}
$d = $J["data-2026.json"]; $det = $J["detail-2026.json"]; $cat = $J["categories.json"]
$suppress = @($J["reviews.json"].reconciliations | Where-Object { $_.suppress } | ForEach-Object { $_.suppress })

# 2. billing summary
$li = @($d.lineItems | Where-Object { $_.period -eq $Period })
$liPrev = @($d.lineItems | Where-Object { $_.period -eq $Prev })
$mt = $d.monthlyTotals | Where-Object { $_.period -eq $Period }
$gt = @($d.groupTotals | Where-Object { $_.period -eq $Period })
Write-Output ("lineItems " + $Period + ": " + $li.Count + " rows; groupTotals: " + $gt.Count)
$dup = $li | Group-Object categoryCode | Where-Object { $_.Count -gt 1 }
if ($dup) { Bad ("duplicate categoryCode: " + ($dup.Name -join ",")) } else { Ok "no duplicate categoryCode" }
$codes = $cat.categories.code
foreach ($x in $li) { if ($codes -notcontains $x.categoryCode) { Bad ("unknown categoryCode " + $x.categoryCode) } }
foreach ($fld in "assessed","residentShare","lhShare","billed","adjustment","previousBilled","change") {
  $s = ($li | Measure-Object -Property $fld -Sum).Sum
  if ($s -eq $mt.$fld) { Ok ("sum lineItems.$fld = monthlyTotals ($s)") } else { Bad ("sum lineItems.$fld $s != monthlyTotals $($mt.$fld)") }
}
foreach ($x in $li) {
  if (($x.billed - $x.previousBilled) -ne $x.change) { Bad ("$($x.categoryCode): billed-previousBilled != change") }
  if (($x.billed - $x.assessed) -ne $x.adjustment) { Bad ("$($x.categoryCode): billed-assessed != adjustment") }
  if (($x.residentShare + $x.lhShare) -ne $x.billed) { Bad ("$($x.categoryCode): residentShare+lhShare != billed") }
  $p = $liPrev | Where-Object { $_.categoryCode -eq $x.categoryCode }
  if ($p -and $p.billed -ne $x.previousBilled) {
    $sup = $suppress | Where-Object { $_.check -eq "prev-link" -and $_.period -eq $Period -and $_.categoryCode -eq $x.categoryCode }
    if ($sup) { Warn ("$($x.categoryCode): previousBilled $($x.previousBilled) != prev billed $($p.billed) — reviews.json reconciliations에 사유 있음") }
    else { Bad ("$($x.categoryCode): previousBilled $($x.previousBilled) != prev billed $($p.billed)") }
  }
}
Ok "row identities checked (change/adjustment/share split/prev continuity)"
# group totals (keyed by groupCode sets, matched to sourceName by order-independent lookup)
$groupSets = @(
  @{ name = "공용관리 합계"; codes = @("common-management") },
  @{ name = "난방 합계"; codes = @("utility-heating") },
  @{ name = "전기 합계"; codes = @("utility-electricity") },
  @{ name = "수도 합계"; codes = @("utility-water") },
  @{ name = "세대사용료 합계"; codes = @("utility-heating","utility-electricity","utility-water") }
)
foreach ($g in $gt) {
  $gs = $groupSets | Where-Object { $_.name -eq $g.sourceName }
  if (-not $gs) { Bad ("groupTotal unknown name: " + $g.sourceName); continue }
  $rows = $li | Where-Object { $gs.codes -contains $_.groupCode }
  foreach ($fld in "assessed","residentShare","lhShare","billed","adjustment","previousBilled","change") {
    $s = ($rows | Measure-Object -Property $fld -Sum).Sum
    if ($s -ne $g.$fld) { Bad ("groupTotal $($g.sourceName).$fld $($g.$fld) != rows $s") }
  }
}
Ok "groupTotals vs rows"
if (($mt.managementFeeBilled - $mt.previousManagementFeeBilled) -ne $mt.managementFeeChange) { Bad "managementFeeChange" } else { Ok "managementFeeChange identity" }

# 3. supplemental tables
$supp = @($d.supplementalTables | Where-Object { $_.period -eq $Period })
$suppPrev = @($d.supplementalTables | Where-Object { $_.period -eq $Prev })
Write-Output ("supplementalTables " + $Period + ": " + ($supp.sourceTable -join ", "))
foreach ($t in $supp) {
  if ($t.sourceTable -in "management-expense","management-income") {
    foreach ($r in $t.rows) { if (($r.previousBalance + $r.currentActivity) -ne $r.currentBalance) { Bad ("$($t.sourceTable) row $($r.name): prev+cur != balance") } }
    foreach ($fld in "previousBalance","currentActivity","currentBalance") {
      $s = ($t.rows | Measure-Object -Property $fld -Sum).Sum
      if ($s -ne $t.totals.$fld) { Bad ("$($t.sourceTable).totals.$fld $($t.totals.$fld) != rows $s") }
    }
    if ($t.subtotals) { foreach ($st in $t.subtotals) { foreach ($fld in "previousBalance","currentActivity","currentBalance") { $s = ($t.rows | Where-Object { $_.group -eq $st.group } | Measure-Object -Property $fld -Sum).Sum; if ($s -ne $st.$fld) { Bad ("$($t.sourceTable) subtotal $($st.group).$fld") } } } }
    $pt = $suppPrev | Where-Object { $_.sourceTable -eq $t.sourceTable }
    if ($pt) {
      for ($i = 0; $i -lt $t.rows.Count; $i++) {
        $r = $t.rows[$i]; $pr = $pt.rows[$i]
        if ($pr -and $pr.name -eq $r.name -and $pr.currentBalance -ne $r.previousBalance) { Bad ("$($t.sourceTable) $($r.name): previousBalance $($r.previousBalance) != prev currentBalance $($pr.currentBalance)") }
      }
    }
    Ok ("$($t.sourceTable): row continuity + totals" + $(if ($pt) { " + prev-month link" } else { " (no prev table)" }))
  } elseif ($t.sourceTable -eq "deposit-balance") {
    $s = ($t.rows | Measure-Object -Property balance -Sum).Sum
    if ($s -ne $t.totals.balance) { Bad ("deposit-balance total $($t.totals.balance) != rows $s") } else { Ok ("deposit-balance total $s") }
  }
}

# 4. detail sections
$doc = $det.documents | Where-Object { $_.period -eq $Period }
Write-Output ("detail sections: " + $doc.sections.Count)
$scopes = $det.allocationScopes
foreach ($sec in $doc.sections) {
  $tag = "sec $($sec.no) $($sec.title)"
  if ($sec.categoryCode) {
    $row = $li | Where-Object { $_.categoryCode -eq $sec.categoryCode }
    if (-not $row) { if ($sec.amount -eq 0) { Ok "$tag : 0원(원문 '-'), 부과총괄 행 없음" } else { Bad "$tag : no lineItem for $($sec.categoryCode)" } }
    elseif ($row.assessed -ne $sec.amount) { Bad "$tag : amount $($sec.amount) != lineItem assessed $($row.assessed)" }
  }
  $allocByCode = @{}
  foreach ($t in $sec.tables) {
    switch ($t.kind) {
      "allocation" {
        $su = ($t.rows | Measure-Object -Property units -Sum).Sum
        $sa = ($t.rows | Measure-Object -Property total -Sum).Sum
        if ($su -ne $t.totalUnits) { Bad "$tag [$($t.title)] units $su != $($t.totalUnits)" }
        if ($sa -ne $t.totalAmount) { Bad "$tag [$($t.title)] rows total $sa != $($t.totalAmount)" }
        if (($t.totalAmount - $t.baseAmount) -ne $t.adjustment) { Bad "$tag [$($t.title)] totalAmount-baseAmount != adjustment" }
        foreach ($r in $t.rows) { if ($null -ne $r.perUnit -and ($r.units * $r.perUnit) -ne $r.total) { Bad "$tag [$($t.title)] $($r.type): units*perUnit != total" } }
        if ($t.scope -and $scopes.($t.scope).units -ne $t.totalUnits) { Bad "$tag [$($t.title)] scope units mismatch" }
        if ($t.scope -and $t.unitRate -and $scopes.($t.scope).area) { $calc = [math]::Round($t.baseAmount / $scopes.($t.scope).area, 2); if ([math]::Abs($calc - $t.unitRate) -gt 0.011) { Warn "$tag [$($t.title)] 원문 단가 $($t.unitRate) vs 발생금액÷면적 $calc (원문 내부 차이, reviews.json 확인)" } }
        $cc = if ($t.categoryCode) { $t.categoryCode } else { $sec.categoryCode }
        if ($cc) { $allocByCode[$cc] = [long]$allocByCode[$cc] + [long]$t.totalAmount }
      }
      "breakdown" {
        $s = ($t.rows | Measure-Object -Property amount -Sum).Sum
        if ($s -ne $t.total) { Bad "$tag breakdown sum $s != $($t.total)" }
        foreach ($st in $t.subtotals) { $g = ($t.rows | Where-Object { $_.group -eq $st.group } | Measure-Object -Property amount -Sum).Sum; if ($g -ne $st.amount) { Bad "$tag breakdown subtotal $($st.group) $g != $($st.amount)" } }
      }
      "composition" { $s = ($t.rows | Measure-Object -Property amount -Sum).Sum; if ($s -ne $t.total) { Bad "$tag composition sum $s != $($t.total)" } }
      "split" {
        foreach ($fld in "amount","sale","rental") { $s = ($t.rows | Measure-Object -Property $fld -Sum).Sum; if ($s -ne $t.total.$fld) { Bad "$tag split $fld $s != $($t.total.$fld)" } }
        foreach ($r in $t.rows) { if (($r.sale + $r.rental) -ne $r.amount) { Bad "$tag split row '$($r.note)': sale+rental != amount" } }
        if ($t.subtotals) { foreach ($st in $t.subtotals) { foreach ($fld in "amount","sale","rental") { $g = ($t.rows | Where-Object { $_.group -eq $st.group } | Measure-Object -Property $fld -Sum).Sum; if ($g -ne $st.$fld) { Bad "$tag split subtotal $($st.group).$fld $g != $($st.$fld)" } } } }
        if ($t.total.amount -ne $sec.amount) { Bad "$tag split total != section amount" }
      }
      "insurance" { $s = ($t.rows | Measure-Object -Property amount -Sum).Sum; if ($s -ne $t.total) { Bad "$tag insurance sum $s != $($t.total)" } }
      "elevatorByBuilding" {
        $k = ($t.rows | Measure-Object -Property kwh -Sum).Sum; $u = ($t.rows | Measure-Object -Property units -Sum).Sum; $a = ($t.rows | Measure-Object -Property total -Sum).Sum
        if ($k -ne $t.totalKwh) { Bad "$tag elevator kwh $k != $($t.totalKwh)" }
        if ($u -ne $t.totalUnits) { Bad "$tag elevator units $u != $($t.totalUnits)" }
        if ($a -ne $t.totalAmount) { Bad "$tag elevator amount $a != $($t.totalAmount)" }
        if (($t.totalAmount - $t.baseAmount) -ne $t.adjustment) { Bad "$tag elevator adjustment" }
        foreach ($r in $t.rows) { if (($r.units * $r.perUnit) -ne $r.total) { Bad "$tag elevator $($r.building) $($r.line): units*perUnit != total" } }
        if ($t.categoryCode) { $allocByCode[$t.categoryCode] = [long]$allocByCode[$t.categoryCode] + [long]$t.totalAmount }
      }
      "usage" {
        if ($t.total) {
          $usup = $suppress | Where-Object { $_.check -eq "usage-total" -and $_.period -eq $Period -and $_.section -eq $sec.no }
          $s = ($t.rows | Measure-Object -Property amount -Sum).Sum
          if ($s -ne $t.total.amount) { if ($usup) { Warn "$tag usage [$($t.title)] rows amount $s != total $($t.total.amount) — reviews.json reconciliations에 사유 있음" } else { Bad "$tag usage [$($t.title)] rows amount $s != total $($t.total.amount)" } }
          if ($null -ne $t.total.quantity) { $q = ($t.rows | Where-Object { $null -ne $_.quantity } | Measure-Object -Property quantity -Sum).Sum; if ($q -ne $t.total.quantity) { Bad "$tag usage [$($t.title)] rows qty $q != total $($t.total.quantity)" } }
          if ($t.subtotals) { foreach ($st in $t.subtotals) { $g = ($t.rows | Where-Object { $_.group -eq $st.group } | Measure-Object -Property amount -Sum).Sum; if ($g -ne $st.amount) { if ($usup) { Warn "$tag usage [$($t.title)] subtotal $($st.group) $g != $($st.amount) — 사유 있음" } else { Bad "$tag usage [$($t.title)] subtotal $($st.group) $g != $($st.amount)" } } } }
        }
      }
      "parking" {
        $s = ($t.rows | Measure-Object -Property total -Sum).Sum; if ($s -ne $t.total) { Bad "$tag parking sum $s != $($t.total)" }
        foreach ($r in $t.rows) { if ($null -ne $r.perUnit -and ($r.units * $r.perUnit) -ne $r.total) { Bad "$tag parking $($r.name)" } }
        if ($t.total -ne $sec.amount) { Bad "$tag parking total != section amount" }
      }
    }
  }
  foreach ($cc in $allocByCode.Keys) {
    $row = $li | Where-Object { $_.categoryCode -eq $cc }
    if ($row -and $row.billed -ne $allocByCode[$cc]) { Bad "$tag : allocation total(s) $($allocByCode[$cc]) != lineItem billed $($row.billed) ($cc)" }
  }
}
Ok "detail sections checked (allocation totals vs lineItem billed per categoryCode)"
foreach ($sec in $doc.sections | Where-Object { $_.relatedCategoryCodes }) {
  $s = ($li | Where-Object { $sec.relatedCategoryCodes -contains $_.categoryCode } | Measure-Object -Property assessed -Sum).Sum
  if ($s -ne $sec.amount) { Bad "sec $($sec.no) $($sec.title): amount $($sec.amount) != related lineItems assessed $s" } else { Ok "sec $($sec.no) $($sec.title) = related lineItems ($s)" }
}
# section amounts sum vs monthly assessed (sections 1..18 cover every billing-summary row)
if ($doc) { $secSum = ($doc.sections | Measure-Object -Property amount -Sum).Sum
if ($secSum -eq $mt.assessed) { Ok "sum of section amounts = monthlyTotals.assessed ($secSum)" } else { Bad "sum of section amounts $secSum != monthlyTotals.assessed $($mt.assessed)" } }
Write-Output ("=== RESULT: " + $(if ($fail -eq 0) { "ALL CHECKS PASSED" } else { "$fail FAILURE(S)" }) + ", $warn warning(s)")
