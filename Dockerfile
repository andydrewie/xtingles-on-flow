FROM node:lts-alpine3.10
RUN apk update && \
    apk --no-cache add curl && \
    sh -ci "$(curl -fsSL https://storage.googleapis.com/flow-cli/install.sh)"
ENV PATH="/root/.local/bin:${PATH}"
WORKDIR '/app'
COPY . ./
RUN chmod +x ./startDocker.sh
RUN npm install
CMD ["./startDocker.sh"]
EXPOSE 3000/tcp