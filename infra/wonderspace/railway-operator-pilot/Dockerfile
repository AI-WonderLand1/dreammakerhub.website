# Private, single-operator WonderSpace pilot. NOT the Coder multi-user control plane.
# Review and pin the tested image digest before enabling any customer workload.
FROM codercom/code-server:4.130.0

USER root
COPY --chmod=0755 start.sh /usr/local/bin/wonderspace-start
WORKDIR /home/coder
EXPOSE 8080
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/usr/local/bin/wonderspace-start"]
