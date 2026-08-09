param(
  [string]$CardsPath = "C:\Users\pheni\Documents\claude-start\деловые-игры\ясен-хрен\игра\описания",
  [string]$PsychologyPath = "C:\Users\pheni\Documents\claude-start\деловые-игры\ясен-хрен\пси гигиена",
  [string]$RulesPath = "C:\Users\pheni\Documents\claude-start\деловые-игры\ясен-хрен\игра\Ясен_Хрен_Инструкция_Участник.docx",
  [string]$OutputPath = "$PSScriptRoot\..\src\data\knowledge-imported.json"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem
$ErrorActionPreference = "Stop"
$files = @(Get-ChildItem -LiteralPath $CardsPath -Filter *.docx -File -Recurse) + @(Get-ChildItem -LiteralPath $PsychologyPath -Filter *.docx -File -Recurse) + @(Get-Item -LiteralPath $RulesPath)
$files = @($files | Sort-Object FullName -Unique)
$documents = @()

foreach ($file in $files) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)
  try {
    $entry = $zip.GetEntry("word/document.xml")
    if ($null -eq $entry) { continue }
    $reader = [IO.StreamReader]::new($entry.Open()); try { $xml = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $paragraphs = @()
    foreach ($match in [regex]::Matches($xml, '<w:p(?:\s[^>]*)?>(.*?)</w:p>', [Text.RegularExpressions.RegexOptions]::Singleline)) {
      $text = (($match.Groups[1].Value -split '<w:t(?:\s[^>]*)?>|</w:t>') | Where-Object { $_ -and $_ -notmatch '<' } | ForEach-Object { [Net.WebUtility]::HtmlDecode($_) }) -join ""
      if (-not [string]::IsNullOrWhiteSpace($text)) { $paragraphs += $text.Trim() }
    }
    if ($paragraphs.Count -eq 0) { continue }
    if ($file.FullName.StartsWith($CardsPath, [StringComparison]::OrdinalIgnoreCase)) { $section = "cards"; $relative = $file.FullName.Substring($CardsPath.Length).TrimStart('\') }
    elseif ($file.FullName.StartsWith($PsychologyPath, [StringComparison]::OrdinalIgnoreCase)) { $section = "psychology"; $relative = $file.FullName.Substring($PsychologyPath.Length).TrimStart('\') }
    else { $section = "rules"; $relative = $file.Name }
    $slug = (($file.BaseName.ToLowerInvariant() -replace "[^a-zа-я0-9]+", "-") -replace "^-|-$", "")
    $documents += [pscustomobject]@{ slug = "source-$slug"; title = $file.BaseName; section = $section; sourcePath = $relative; paragraphs = $paragraphs; paragraphCount = $paragraphs.Count; characterCount = (($paragraphs -join "`n").Length) }
  } finally { $zip.Dispose() }
}

$totalParagraphs = 0; $totalCharacters = 0
foreach ($d in $documents) { $totalParagraphs += [int]$d.paragraphCount; $totalCharacters += [int]$d.characterCount }
$payload = [ordered]@{ generatedAt = (Get-Date).ToString("o"); documentCount = $documents.Count; totalParagraphs = $totalParagraphs; totalCharacters = $totalCharacters; documents = @($documents) }
$parent = Split-Path -Parent $OutputPath; New-Item -ItemType Directory -Force -Path $parent | Out-Null
[IO.File]::WriteAllText([IO.Path]::GetFullPath($OutputPath), ($payload | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))
Write-Output ("Imported {0} DOCX files, {1} paragraphs, {2} characters -> {3}" -f $payload.documentCount, $payload.totalParagraphs, $payload.totalCharacters, $OutputPath)
