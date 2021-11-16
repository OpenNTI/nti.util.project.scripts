<!-- markdownlint-disable MD030 MD033 -->

# nti.util.project.scripts

Repo of project scripts. These scripts manage dependencies as well as project life cycles.

## Project structure

This is a lerna mono-repo. The root package is a meta package and does not represent a single artifact. Its sole purpose is to manage lerna and common dependencies for releasing/testing the individual projects within.

| dir                                                                     | purpose                                                                                                                                                                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`.github`][.github]                                                    | This directory contains the configuration files for github features (dependabot, actions, etc)                                                                                                     |
| [`actions/sync`][actions/sync]                                          | A custom github action step to synchronize project template files into all dependent projects within the NextThought org                                                                           |
| [`packages`][packages]                                                  | The main directory of all leaf projects                                                                                                                                                            |
| [`packages/command-clone`][cmd-clone]                                   | The main initialization command to clone all projects and install them into a workspace. Workspace template files are located here as well.                                                        |
| [`packages/command-fix`][cmd-fix]                                       | The command to start a fix on a maintenance branch. This will create/checkout-head of the `maint-X.X` branch of the project.                                                                       |
| [`packages/command-gen-docs`][cmd-gen-docs]                             | Prototype command to generate documents from jsdoc comments. Was never really used.                                                                                                                |
| [`packages/command-pre-commit`][cmd-pre-commit]                         | Command run during a precommit event. Blocking code with lint errors.                                                                                                                              |
| [`packages/command-release`][cmd-release]                               | The command that releases a new release from master or a new patch from maint.                                                                                                                     |
| [`packages/command-rollup`][cmd-rollup]                                 | A tool to run rollup on a directory with just a rollup config. Was only used to babel / commonjs-ify the mobile server directory.                                                                  |
| [`packages/command-snapshot`][cmd-snapshot]                             | This command will dispatch an event to github to start a snapshot build. This command is context aware of the current directory and will use the github origin to send the dispatch event details. |
| [`packages/command-workspace-post-install`][cmd-workspace-post-install] | To workaround a limitation of npm7, this script performs some cleanup and invokes the workspace's 'build' script defined in the root package.json as well as run docker setup/update scripts.      |
| [`packages/command-workspace-refresh`][cmd-workspace-refresh]           | Reinitialize the workspace, reinstalling node_modules.                                                                                                                                             |
| [`packages/dev-ssl-config`][dev-ssl-config]                             | dev tool library to acquire the ssl cert from the docker container or the locally install buildout.                                                                                                |
| [`packages/github-api`][github-api]                                     | API library wrapper for github. Used by various command line tools in this repo.                                                                                                                   |
| [`packages/lint-config-app-scripts`][lint-config-app-scripts]           | Extends `lint-config-lib-scripts` to add/configure lint rules appropriate from React projects.                                                                                                     |
| [`packages/lint-config-lib-scripts`][lint-config-lib-scripts]           | Sets the base lint rules for all js projects                                                                                                                                                       |
| [`packages/lint-config-styles`][lint-config-styles]                     | Sets the base lint rules for all css in each project.                                                                                                                                              |
| [`packages/scripts-app`][scripts-app]                                   | Extends lib-scripts to add webpack config and dev-server common runtime and overrides some templates                                                                                               |
| [`packages/scripts-ci`][scripts-ci]                                     | Defines the steps used in Jenkinsfile pipelines and commands for GitHub Actions to test/lint/build projects                                                                                        |
| [`packages/scripts-cmp`][scripts-cmp]                                   | Extends app-scripts to add storybook and templates/config/commands appropriate for component libraries that are not standalone apps.                                                               |
| [`packages/scripts-lib`][scripts-lib]                                   | Defines the template files, common configs, and actions for js projects. (start, test, fix, snapshot, init, install, etc)                                                                          |

### Core concepts

1. Command hierarchy: lib -> app -> cmp. each overrides portions of the templates and commands in the package below it.
2. These projects depend on a paths.js that makes the assumption that commands are executed by npm in the host project root.
3. configs are passed to tools by wrappers. eg: test calls jest and passes a config. in app-scripts, start wraps web-service and passes a config.
4. node_module resolution algorithm is heavily assumed

### Common dependencies

Dependencies needed by the build/test tools as well as shared (react) libraries are mananaged by specifying them in the lib/app scripts projects.

---

## Build Statuses

[![Health Check](https://github.com/NextThought/nti.web.app/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.app/actions) nti.web.app<br/>
[![Health Check](https://github.com/NextThought/nti.web.environments/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.environments/actions) nti.web.environments<br/>
[![Health Check](https://github.com/NextThought/nti.web.login/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.login/actions) nti.web.login<br/>
[![Health Check](https://github.com/NextThought/nti.web.mobile/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.mobile/actions) nti.web.mobile<br/>

---

[![Health Check](https://github.com/NextThought/nti.lib.analytics/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.analytics/actions) nti.lib.analytics<br/>
[![Health Check](https://github.com/NextThought/nti.lib.anchors/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.anchors/actions) nti.lib.anchors<br/>
[![Health Check](https://github.com/NextThought/nti.lib.commons/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.commons/actions) nti.lib.commons<br/>
[![Health Check](https://github.com/NextThought/nti.lib.content-processing/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.content-processing/actions) nti.lib.content-processing<br/>
[![Health Check](https://github.com/NextThought/nti.lib.decorators/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.decorators/actions) nti.lib.decorators<br/>
[![Health Check](https://github.com/NextThought/nti.lib.dispatcher/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.dispatcher/actions) nti.lib.dispatcher<br/>
[![Health Check](https://github.com/NextThought/nti.lib.dom/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.dom/actions) nti.lib.dom<br/>
[![Health Check](https://github.com/NextThought/nti.lib.interfaces/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.interfaces/actions) nti.lib.interfaces<br/>
[![Health Check](https://github.com/NextThought/nti.lib.locale/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.locale/actions) nti.lib.locale<br/>
[![Health Check](https://github.com/NextThought/nti.lib.ntiids/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.ntiids/actions) nti.lib.ntiids<br/>
[![Health Check](https://github.com/NextThought/nti.lib.ranges/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.ranges/actions) nti.lib.ranges<br/>
[![Health Check](https://github.com/NextThought/nti.lib.store.connector/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.store.connector/actions) nti.lib.store.connector<br/>
[![Health Check](https://github.com/NextThought/nti.lib.store/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.store/actions) nti.lib.store<br/>
[![Health Check](https://github.com/NextThought/nti.lib.whiteboard/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.lib.whiteboard/actions) nti.lib.whiteboard<br/>
[![Health Check](https://github.com/NextThought/nti.util.detection.touch/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.util.detection.touch/actions) nti.util.detection.touch<br/>
[![Health Check](https://github.com/NextThought/nti.util.git.rev/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.util.git.rev/actions) nti.util.git.rev<br/>
[![Health Check](https://github.com/NextThought/nti.util.ios-version/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.util.ios-version/actions) nti.util.ios-version<br/>
[![Health Check](https://github.com/NextThought/nti.util.logger/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.util.logger/actions) nti.util.logger<br/>
[![Health Check](https://github.com/NextThought/nti.web.assignment-editor/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.assignment-editor/actions) nti.web.assignment-editor<br/>
[![Health Check](https://github.com/NextThought/nti.web.calendar/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.calendar/actions) nti.web.calendar<br/>
[![Health Check](https://github.com/NextThought/nti.web.catalog/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.catalog/actions) nti.web.catalog<br/>
[![Health Check](https://github.com/NextThought/nti.web.charts/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.charts/actions) nti.web.charts<br/>
[![Health Check](https://github.com/NextThought/nti.web.client/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.client/actions) nti.web.client<br/>
[![Health Check](https://github.com/NextThought/nti.web.commons/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.commons/actions) nti.web.commons<br/>
[![Health Check](https://github.com/NextThought/nti.web.contacts/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.contacts/actions) nti.web.contacts<br/>
[![Health Check](https://github.com/NextThought/nti.web.content/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.content/actions) nti.web.content<br/>
[![Health Check](https://github.com/NextThought/nti.web.core/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.core/actions) nti.web.core<br/>
[![Health Check](https://github.com/NextThought/nti.web.course/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.course/actions) nti.web.course<br/>
[![Health Check](https://github.com/NextThought/nti.web.discussions/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.discussions/actions) nti.web.discussions<br/>
[![Health Check](https://github.com/NextThought/nti.web.editor/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.editor/actions) nti.web.editor<br/>
[![Health Check](https://github.com/NextThought/nti.web.help/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.help/actions) nti.web.help<br/>
[![Health Check](https://github.com/NextThought/nti.web.integrations/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.integrations/actions) nti.web.integrations<br/>
[![Health Check](https://github.com/NextThought/nti.web.library/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.library/actions) nti.web.library<br/>
[![Health Check](https://github.com/NextThought/nti.web.modeled-content/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.modeled-content/actions) nti.web.modeled-content<br/>
[![Health Check](https://github.com/NextThought/nti.web.notifications/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.notifications/actions) nti.web.notifications<br/>
[![Health Check](https://github.com/NextThought/nti.web.payments/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.payments/actions) nti.web.payments<br/>
[![Health Check](https://github.com/NextThought/nti.web.profiles/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.profiles/actions) nti.web.profiles<br/>
[![Health Check](https://github.com/NextThought/nti.web.reports/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.reports/actions) nti.web.reports<br/>
[![Health Check](https://github.com/NextThought/nti.web.routing/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.routing/actions) nti.web.routing<br/>
[![Health Check](https://github.com/NextThought/nti.web.search/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.search/actions) nti.web.search<br/>
[![Health Check](https://github.com/NextThought/nti.web.service/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.service/actions) nti.web.service<br/>
[![Health Check](https://github.com/NextThought/nti.web.session/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.session/actions) nti.web.session<br/>
[![Health Check](https://github.com/NextThought/nti.web.storage/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.storage/actions) nti.web.storage<br/>
[![Health Check](https://github.com/NextThought/nti.web.video/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.video/actions) nti.web.video<br/>
[![Health Check](https://github.com/NextThought/nti.web.whiteboard/workflows/Project%20Health/badge.svg)](https://github.com/NextThought/nti.web.whiteboard/actions) nti.web.whiteboard<br/>

[.github]: https://github.com/NextThought/nti.util.project.scripts/tree/master/.github
[actions/sync]: https://github.com/NextThought/nti.util.project.scripts/tree/master/actions/sync
[packages]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages
[cmd-clone]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-clone
[cmd-fix]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-fix
[cmd-gen-docs]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-gen-docs
[cmd-pre-commit]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-pre-commit
[cmd-release]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-release
[cmd-rollup]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-rollup
[cmd-snapshot]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-snapshot
[cmd-workspace-post-install]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-workspace-post-install
[cmd-workspace-refresh]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/command-workspace-refresh
[dev-ssl-config]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/dev-ssl-config
[github-api]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/github-api
[lint-config-app-scripts]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/lint-config-app-scripts
[lint-config-lib-scripts]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/lint-config-lib-scripts
[lint-config-styles]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/lint-config-styles
[scripts-app]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/scripts-app
[scripts-ci]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/scripts-ci
[scripts-cmp]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/scripts-cmp
[scripts-lib]: https://github.com/NextThought/nti.util.project.scripts/tree/master/packages/scripts-lib
