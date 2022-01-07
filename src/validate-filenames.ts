import fs from 'fs';
import glob from 'glob-promise';

export async function validateFilenames(
  path: string,
  pattern: RegExp,
  globPattern?: string,
  ignoreGlob?: string[]
): Promise<{
  totalFilesAnalyzed: number;
  failedFiles: string[];
}> {
  console.debug(`ℹ️  Path:    \t\t'${path}'`);
  console.log(`ℹ️  Pattern: \t\t${pattern}`);
  const opendir = fs.promises.opendir;
  const failedFiles: string[] = [];
  let totalFilesAnalyzed = 0;

  try {
    console.log('Verification starting...');

    let pathsToAnalyze: string[];

    if (globPattern) {
      const matches = await glob(globPattern, {
        dot: true,
        ignore: ignoreGlob,
        cwd: path,
        nodir: true,
      });
      pathsToAnalyze = matches;
    } else {
      const dir = await opendir(path);
      pathsToAnalyze = [];
      for await (const dirent of dir) {
        if (dirent.isDirectory()) {
          continue;
        }
        pathsToAnalyze.push(dirent.name);
      }
    }

    for (const p of pathsToAnalyze) {
      if (pattern.test(p)) {
        console.debug(`  ✔️  ${p}`);
      } else {
        console.debug(`  ❌  ${p}`);
        failedFiles.push(p);
      }
    }
    totalFilesAnalyzed = pathsToAnalyze.length;

    console.log('Verification finished.');
    console.debug(`ℹ️  Files analyzed: \t${totalFilesAnalyzed}`);
  } catch (error) {
    throw new Error('Execution failed, see log above. ❌');
  }

  if (failedFiles.length) {
    throw new Error(
      `${failedFiles.length} files not matching the pattern were found, see log above. ❌`
    );
  } else {
    console.log('✅ Success: All files match the given pattern!');

    return {
      totalFilesAnalyzed,
      failedFiles,
    };
  }
}
