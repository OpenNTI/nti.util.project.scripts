# nti.util.project.scripts

Repo of project scripts. These scripts manage releasing as well as dev dependencies.

## Build Statuses

 <style>
 #grid {
  display:grid;
  gap: 1em;
  grid-template-columns: repeat(auto-fill, minmax(20vw, 3fr));
 }
</style>

<div id="grid">
<status-badge repo="NextThought/nti.web.service"></status-badge>
<status-badge repo="NextThought/nti.web.mobile"></status-badge>
<status-badge repo="NextThought/nti.web.login"></status-badge>
<status-badge repo="NextThought/nti.web.app"></status-badge>
<status-badge repo="NextThought/nti.web.video"></status-badge>
<status-badge repo="NextThought/nti.web.modeled-content"></status-badge>
<status-badge repo="NextThought/nti.web.client"></status-badge>
<status-badge repo="NextThought/nti.web.assignment-editor"></status-badge>
<status-badge repo="NextThought/nti.web.commons"></status-badge>
<status-badge repo="NextThought/nti.web.whiteboard"></status-badge>
<status-badge repo="NextThought/nti.web.discussions"></status-badge>
<status-badge repo="NextThought/nti.web.content"></status-badge>
<status-badge repo="NextThought/nti.util.logger"></status-badge>
<status-badge repo="NextThought/nti.util.detection.touch"></status-badge>
<status-badge repo="NextThought/nti.util.git.rev"></status-badge>
<status-badge repo="NextThought/nti.util.ios-version"></status-badge>
<status-badge repo="NextThought/nti.lib.dom"></status-badge>
<status-badge repo="NextThought/nti.lib.anchors"></status-badge>
<status-badge repo="NextThought/nti.lib.interfaces"></status-badge>
<status-badge repo="NextThought/nti.lib.whiteboard"></status-badge>
<status-badge repo="NextThought/nti.lib.ranges"></status-badge>
<status-badge repo="NextThought/nti.lib.ntiids"></status-badge>
<status-badge repo="NextThought/nti.lib.content-processing"></status-badge>
<status-badge repo="NextThought/nti.lib.store"></status-badge>
<status-badge repo="NextThought/nti.lib.dispatcher"></status-badge>
<status-badge repo="NextThought/nti.lib.locale"></status-badge>
<status-badge repo="NextThought/nti.lib.commons"></status-badge>
<status-badge repo="NextThought/nti.lib.analytics"></status-badge>
<status-badge repo="NextThought/nti.lib.vendor"></status-badge>
<status-badge repo="NextThought/nti.web.storage"></status-badge>
<status-badge repo="NextThought/nti.lib.decorators"></status-badge>
<status-badge repo="NextThought/nti.util.project.scripts"></status-badge>
<status-badge repo="NextThought/nti.lib.store.connector"></status-badge>
<status-badge repo="NextThought/nti.web.course"></status-badge>
<status-badge repo="NextThought/nti.web.editor"></status-badge>
<status-badge repo="NextThought/nti.web.catalog"></status-badge>
<status-badge repo="NextThought/nti.web.contacts"></status-badge>
<status-badge repo="NextThought/nti.web.searc h"></status-badge>
<status-badge repo="NextThought/nti.web.session"></status-badge>
<status-badge repo="NextThought/nti.web.charts"></status-badge>
<status-badge repo="NextThought/nti.web.routing"></status-badge>
<status-badge repo="NextThought/nti.web.reports"></status-badge>
<status-badge repo="NextThought/nti.util.dashboard"></status-badge>
<status-badge repo="NextThought/nti.web.help"></status-badge>
<status-badge repo="NextThought/nti.web.profiles"></status-badge>
<status-badge repo="NextThought/nti.web.integrations"></status-badge>
<status-badge repo="NextThought/nti.web.library"></status-badge>
<status-badge repo="NextThought/nti.web.payments"></status-badge>
<status-badge repo="NextThought/nti.web.calendar"></status-badge>
<status-badge repo="NextThought/nti.web.notifications"></status-badge>
<status-badge repo="NextThought/nti.web.environments"></status-badge>
</div>

<template id="badge">
    <a href="$repo" target="_blank" rel="noopener noreferrer">
        <img alt="Build Status" width="156" height="20"/>
    </a>
</template>

<script type="text/javascript">
    const template = x => document.getElementById(x).content.cloneNode(true);
    customElements.define('status-badge',
        class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({mode: 'open'});
                this.shadowRoot.appendChild(template('badge'));
                const repo = `http://github.com/${this.getAttribute('repo')}`;
                const link = this.shadowRoot.querySelector('a');
                const img = this.shadowRoot.querySelector('img');
                link.setAttribute('href', repo);
                img.setAttribute('src', `${repo}/workflows/Project%20Health/badge.svg`)
                const label = document.createElement('span');
                label.textContent =  this.getAttribute('repo');
                link.appendChild(label);
            }
    });
</script>
